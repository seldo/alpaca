import { prisma } from "~/db.server";
import { getInstanceFromAccount, createPostHash } from "~/shared/components/post";
import { redirect } from "@remix-run/node";
import { authenticator } from "~/services/auth.server"

// FIXME: it's sort of debatable that we need this except as a cache for later?
// we already have all the data from the verification call
export const getOrCreateUserFromData = async (userData, options = {
  withTweets: false
}) => {
  console.log("getOrCreateUserFromData")
  // first try fetching them from the database
  let user = await getOrCreateUserLocal(userData, { withTweets: options.withTweets })
  // if we don't find them we store them
  if (!user) {
    console.log(`User ${userData.username}@${userData.instance} not found`)
    user = await prisma.user.create({
      data: {
        username: userData.username,
        userInstance: userData.instance,
        display_name: userData.display_name,
        json: userData
      },
      skipDuplicates: true
    })
  }
  // since we want to return user.json and we already had it, just return userData
  return userData
}

export const getOrCreateUserLocal = async (user, options = {
  withTweets: false
}) => {
  console.log("getUserLocal")

  // see if they're in the database
  let conditions = {
    where: {
      username_userInstance: {
        username: user.username,
        userInstance: user.instance
      }
    }
  }
  if (options.withTweets) {
    conditions.include = {
      tweets: {
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  }
  let userData = await prisma.user.findUnique(conditions)
  if (!userData) {
    console.log("getUserLocal: user not found")
    return false
  }
  if (userData.error) {
    console.error("getUserLocal: error fetching using",user)
    return false
  }
  userData = formatUserPosts(user)
  console.log("getUserLocal: found user " + user.username)
  return userData
}

/**
 * Transform a user object's posts into mastodon's richer format
 * @param {} user 
 * @returns 
 */
 function formatUserPosts(user) {
  // only reformat if we haven't already done so
  if (user.posts && user.posts.length > 0 && user.posts[0].json) {
    let formattedPosts = user.posts.map((t) => {
      return t.json
    })
    user.posts = formattedPosts
  }
  return user
}

/**
 * Gets the most recent tweets in the user's timeline
 * @param {} userData   User object must include username and instance
 * @param {*} options 
 *    hydrate   boolean Whether to hydrate the tweets 
 * @returns array of tweet IDs (default) or full tweets (if hydrate=true)
 */
 export const getTimelineLocal = async (userData, options = {
  hydrate: false
}) => {
  console.log("getTimelineLocal")

  let query = {
    where: {
      viewerName: userData.username,
      AND: {
        viewerInstance: userData.instance
      }
    },
    orderBy: {
      seenAt: "desc"
    }
  }
  if (options.hydrate) {
    query.include = {
      post: true
    }
  }

  let timelineEntries = await prisma.timelineEntry.findMany(query)

  // transform into full tweets
  if (options.hydrate) {
    let entries = timelineEntries.map((entry) => {
      return entry.post.json
    })
    let timeline = formatPostUsers(entries)
    return timeline
  } else {
    return timelineEntries
  }

}

/**
 * Transform mastodon's account object on each post to include an instance
 * @param {} tweets 
 */
 function formatPostUsers(posts) {
  if (posts && posts.length > 0) {
    return posts.map((t) => {
      t.account.instance = getInstanceFromAccount(t.account)
      return t
    })
  } else {
    return posts
  }
}

/**
 * Fetches a user's timeline from the remote Mastodon instance. 
 * Stores the timeline entries in the timeline cache, and stores 
 * any tweets and authors we haven't seen before into those caches.
 * @param {}      userData  Must contain an .id and .accessToken property
 * @param String  minId     Tweets before this ID will not be fetched
 * @returns array of fully-hydrated tweets including RTs.
 */
 export async function getTimelineRemote(user, minId = null) {
  console.log("getTimelineRemote")
  let timelineData
  try {
    let timelineUrl = new URL(getInstanceUrl(user.instance) + `/api/v1/timelines/home`)
    if(minId) {
      timelineUrl.searchParams.append("min_id",minId)
    }    
    timelineData = await fetch(timelineUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${user.accessToken}`
      }
    })
    let timelineRaw = await timelineData.json()
    // format it
    let timeline = formatPostUsers(timelineRaw)
    try {
      // TODO: can we async this and just not wait?
      await storeTimeline(user, timeline)
    } catch (e) {
      console.log("Error storing timeline", e)
    }
    return timeline
  } catch (e) {
    console.log("Error fetching timeline", e)
    return []
  }
}

// FIXME: be smarter than this
const getInstanceUrl = (instanceName) => {
  return "https://" + instanceName
}

const storeTimeline = async (viewer, timeline) => {
  console.log(`storeTimeline`)
  // store the posts themselves so we can satisfy db constraints
  let storedPosts = await storePosts(timeline)

  // now store these timeline entries
  let batchData = []
  for (let i = 0; i < timeline.length; i++) {
    let entry = timeline[i]
    batchData.push({
      seenAt: entry.created_at,
      authorName: entry.account.username,
      authorInstance: entry.account.instance,
      postHash: await createPostHash(entry),
      viewerName: viewer.username,
      viewerInstance: viewer.instance
    })
  }

  let storedTimelineEntries = await prisma.timelineEntry.createMany({
    data: batchData,
    skipDuplicates: true
  })

  return storedTimelineEntries

}

const storePosts = async (posts) => {
  console.log("storePosts")
  let postsToStore = []  
  let authorsToStore = []
  for (let i = 0; i < posts.length; i++) {
    let postData = posts[i]
    // if there's a reblog in the post
    // we store the reblog itself as a post
    // and separately the post containing the reblog
    // TODO: we can pull the reblog out of the data and hydrate it probably
    // FIXME: .length is not quite right but it will do for now
    if (postData.reblog && postData.reblog.length > 0) {
      let reblog = postData.reblog
      reblog.account.instance = getInstanceFromAccount(reblog.account)
      authorsToStore.push(reblog.account)
      reblog.hash = await createPostHash(reblog)
      postsToStore.push(reblog)
      postData.reblog = reblog.hash
    }
    postData.account.instance = getInstanceFromAccount(postData.account)
    authorsToStore.push(postData.account)
    postData.hash = await createPostHash(postData)
    postsToStore.push(postData)
  }
  // have to store the authors
  let storedUsers = storeUsers(authorsToStore)
  // now we can store the posts
  let batchData = postsToStore.map( (p) => {
    return {
      permalink: p.hash,
      text: p.content,
      hash: p.hash,
      createdAt: p.created_at,
      json: p,
      authorName: p.account.username,
      authorInstance: p.account.instance
    }  
  })
  const storedPosts = await prisma.post.createMany({
    data: batchData,
    skipDuplicates: true
  })
  return storedPosts  
}

const storeUsers = async (users) => {
  console.log("storeUsers")
  // before we can store users we need to store their instances
  let instances = []
  for(let i = 0; i < users.length; i++) {
    instances.push(users[i].instance)
  }
  let storedInstances = storeInstances(instances)
  // now we can store the users
  let batchData = users.map( (u) => {
    return {
      username: u.username,
      userInstance: u.instance,
      display_name: u.display_name,
      json: u
    }  
  })
  const storedUsers = await prisma.user.createMany({
    data: batchData,
    skipDuplicates: true
  })
  return storedUsers  
}

const storeInstances = async (instances) => {
  let batchData = instances.map( (u) => {
    return {
      name: u,
      url: "https://" + u // FIXME: be smarter
    }  
  })
  const storedInstances = await prisma.instance.createMany({
    data: batchData,
    skipDuplicates: true
  })
  return storedInstances
}

export const search = async (query, user, options = { token: null }) => {
  console.log("search")
  if (query === null) return false // why does mastodon search for null anyway?
  let searchUrl = new URL(getInstanceUrl(user.instance) + `/api/v2/search`)
  searchUrl.searchParams.set('q', query)
  searchUrl.searchParams.set('resolve', true)
  let searchData = await fetch(searchUrl.toString(), {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${options.token}`
    }
  })
  let searchResults = await searchData.json()
  if (searchResults.error) return false
  // format search results
  if(searchResults.accounts && searchResults.accounts.length > 0) {
    // accounts need instance names
    searchResults.accounts = searchResults.accounts.map( (a) => {
      a.instance = getInstanceFromAccount(a)
      return a
    })
    // FIXME: following data is slow af so let's do it async on the client, later
  }

  return searchResults
}























/////////////////////// refactor boundary ////////////////////////

export async function getUserByUsername(username, instanceName, options = {
  withTweets: false
}) {
  console.log("getUserByUsername")
  let instance = await getOrCreateInstanceByName(instanceName)

  // see if they're in the database
  let conditions = {
    where: {
      username_instanceId: {
        username,
        instanceId: instance.id
      },
    }
  }
  if (options.withTweets) {
    conditions.include = {
      tweets: {
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  }
  let user
  try {
    user = await prisma.user.findUnique(conditions)
    if (user) user = formatUserTweets(user)
    console.log("Getuserbyusername found " + username)
    return user
  } catch (e) {
    console.error("getUserByUsername threw error while fetching " + username)
    return user
  }
}

export async function getOrFetchUserByUsername(username, theirInstanceName, ourInstanceName, options = {
  withTweets: false,
  token: null
}) {
  console.log("getOrFetchUserByUsername")
  // first look in the database
  let user = await getUserByUsername(username, theirInstanceName, { withTweets: options.withTweets })
  // if we don't have them (unlikely) or we've never looked them up on our local instance (likely)
  // then we fetch them from the API and update their local id
  if (!user || !user.internalId) {
    // we must use webfinger because they probably aren't in our cache
    let instance = await getOrCreateInstanceByName(ourInstanceName)
    let userData = await fetch(instance.url + `/api/v1/accounts/lookup?acct=${username + "@" + theirInstanceName + "&skip_webfinger=false"}`, {
      method: "GET"
    })
    // get user data
    user = await userData.json()
    //console.log("GoFuBu user",user)
    // FIXME: ugly hack to match format of db
    user.json = JSON.parse(JSON.stringify(user))
    user.instance = theirInstanceName
    user.internalId = user.id
    // store user data
    await getOrCreateUserFromData(user)
  }
  // they might have never tweeted, we might never have fetched their tweets, let's do it either way
  if (!user.tweets || (user.tweets && user.tweets.length == 0)) {
    // get + store (public) user tweets
    // TODO: if we've got a token and are the user we should fetch private tweets too
    user.tweets = await getOrFetchTweetsByUserId(user.id, theirInstanceName)
  }
  return user
}

const instanceCache = {}

// FIXME: we can be sure in any given call that this doesn't change
// so we can set a global var and not hit the db every time
export async function getOrCreateInstanceByName(instanceName) {
  //console.log("getOrCreateInstanceByName")
  // first look in the cache
  if (instanceCache[instanceName]) return instanceCache[instanceName]
  // then look in the db
  let instance = await prisma.instance.findUnique({
    where: {
      name: instanceName
    }
  })
  // if not in the db then put it there
  if(!instance) {
    instance = await prisma.instance.create({
      data: {
        name: instanceName,
        url: "https://" + instanceName
      }
    })
  }
  // either way store it in the cache for next time
  instanceCache[instanceName] = instance
  return instance
}

export const getTimelineEntriesByUserId = async (userId, instanceName, options) => {
  console.log("getTimelineEntriesByUserId")
  let instance = await getOrCreateInstanceByName(instanceName)
  let query = {
    where: {
      viewerId: userId,
      AND: {
        instanceId: instance.id
      }
    },
    orderBy: {
      seenAt: "desc"
    }
  }

  let tweets = await prisma.timelineEntry.findMany(query)
  return tweets
}

export const getTweetsByUserId = async (userId, theirInstanceName) => {
  console.log("getTweetsByUserId")
  let instance = await getOrCreateInstanceByName(theirInstanceName)
  let query = {
    where: {
      authorId: userId,
      AND: {
        instanceId: instance.id
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  }
  let tweetData = await prisma.tweet.findMany(query)
  // hydrate them
  let tweets = tweetData.map( t => {
    return t.json
  })
  return tweets
}

export const getOrFetchTweetsByUserId = async (userId, instanceName, options) => {
  console.log(`getOrFetchTweetsByUserId looking for tweets by user ${userId}@${instanceName}`)
  // try to get them locally first
  let tweets = await getTweetsByUserId(userId, instanceName)
  // if we get no tweets, we try to fetch them, but technically there might not be any
  if (tweets.length == 0) {
    console.log("Didn't find any tweets, so fetching")
    tweets = await fetchTweetsByUserId(userId, instanceName, options)
  }
  if (tweets) tweets = formatTweetUsers(tweets)
  return tweets
}

export const fetchTweetsByUserId = async (userId, instanceName, options) => {
  console.log("FetchTweetsByUserId")
  let instance = await getOrCreateInstanceByName(instanceName)
  let tweetData = await fetch(instance.url + `/api/v1/accounts/${userId}/statuses`, {
    method: "GET"
    // TODO: might want to get private tweets with token if authed
  })
  let tweets = await tweetData.json()
  if (tweets) tweets = formatTweetUsers(tweets)
  // now store them for later
  await storeTweets(tweets,instance)
  return tweets
}

export const isFollowing = async (user, followingId, instanceName) => {
  console.log("isFollowing")
  let instance = await getOrCreateInstanceByName(user.instance)
  console.log("isFollowing looking for ",followingId)
  let followingRequestUrl = new URL(instance.url + "/api/v1/accounts/relationships")
  followingRequestUrl.searchParams.set('id', followingId)
  console.log("Following request URL",followingRequestUrl.toString(),"token",user.accessToken)
  let followingData = await fetch(followingRequestUrl.toString(), {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${user.accessToken}`
    }
  })
  let following = await followingData.json()
  //console.log("isFollowing data was",following)
  if (following[0]) return following[0]
  else return {following:false}
}

const getOrCreateTweet = async (tweetData,instanceId) => {
  console.log("getOrCreateTweet")
  // see if it's in the database
  let tweet = await prisma.tweet.findUnique({
    where: {
      id_instanceId: {
        id: tweetData.id,
        instanceId
      }
    }
  })
  // if so return, otherwise insert them first
  if (!tweet) {
    tweet = await prisma.tweet.upsert({
      where: {
        id_instanceId: {
          id: tweetData.id,
          instanceId
        }
      },
      update: {
        permalink: tweetData.url ? tweetData.url : tweetData.uri,
        text: tweetData.content,
        createdAt: tweetData.created_at,
        authorId: tweetData.account.id,
        json: tweetData
      },
      create: {
        id: tweetData.id,
        instanceId,
        permalink: tweetData.url ? tweetData.url : tweetData.uri,
        text: tweetData.content,
        createdAt: tweetData.created_at,
        authorId: tweetData.account.id,
        json: tweetData
      }
    })
  } else {
    console.log(`Tweet ${tweetData.id} exists already, fast path.`)
  }
  return tweet
}

export const followUserById = async (followId, instanceName, userToken) => {
  console.log("FollowUserById")
  let instance = await getOrCreateInstanceByName(instanceName)

  let followRequestUrl = new URL(instance.url + `/api/v1/accounts/${followId}/follow`)
  let followData = await fetch(followRequestUrl.toString(), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${userToken}`
    }
  })
  let follow = await followData.json()
  return follow
}

export const unfollowUserById = async (followId, instanceName, userToken) => {
  console.log("UnfollowUserById")
  let instance = await getOrCreateInstanceByName(instanceName)
  console.log("Unfollowing using token auth", userToken)
  let followRequestUrl = new URL(instance.url + `/api/v1/accounts/${followId}/unfollow`)
  let followData = await fetch(followRequestUrl.toString(), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${userToken}`
    }
  })
  let follow = await followData.json()
  return follow
}

export const storeNotifications = async (notifications, forWhom, instanceName) => {
  console.log("storeNotifications")
  // store all the notifications in one big transaction
  let batchInsert = []
  for (let i = 0; i < notifications.length; i++) {
    let n = notifications[i]
    let instance = await getOrCreateInstanceByName(instanceName)
    batchInsert.push({
      id: n.id,
      instanceId: instance.id,
      createdAt: n.created_at,
      type: n.type,
      json: n,
      userId: forWhom
    })
  }

  const storedNotifications = await prisma.notification.createMany({
    data: batchInsert,
    skipDuplicates: true
  })

  return storedNotifications
}

const forceAuthRefresh = () => {
  throw redirect('/auth/mastodon')
}

export const fetchAndStoreNotifications = async (user, instanceId, minId = null) => {
  console.log("FetchAndStoreNotifications")
  let instance = await getOrCreateInstanceByName(user.instance)
  let notificationsUrl = new URL(instance.url + `/api/v1/notifications`)
  notificationsUrl.searchParams.set('limit', 200)
  let notificationsData = await fetch(notificationsUrl.toString(), {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${user.accessToken}`
    }
  })
  if (notificationsData.status != "200") forceAuthRefresh()
  let notifications = await notificationsData.json()
  await storeNotifications(notifications, user.id, user.instance)
  return notifications
}

export const getNotificationsByUserId = async (userId,instanceName) => {
  console.log("GetNotificationsByUserId")
  let instance = await getOrCreateInstanceByName(instanceName)
  let query = {
    where: {
      instanceId: instance.id,
      AND: {
        userId
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  }

  let notificationsRaw = await prisma.notification.findMany(query)

  // turn them back into the mastodon format
  let notifications = notificationsRaw.map(n => {
    return n.json
  })

  return notifications
}

export const getOrFetchNotifications = async (user) => {
  console.log("getOrFetchNotifications")
  let notifications = await getNotificationsByUserId(user.id,user.instance)
  if (!notifications) {
    notifications = fetchAndStoreNotifications(user)
  }
  return notifications
}

export const createPost = async (user, data = {text:null}) => {
  console.log("createPost")
  let instance = await getOrCreateInstanceByName(user.instance)
  let postUrl = new URL(instance.url + `/api/v1/statuses`)
  if (data.text === null || data.text === "") throw new Error("Text cannot be empty")

  var formData = new FormData();
  formData.append("status", data.text);

  let postedData = await fetch(postUrl.toString(), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${user.accessToken}`
    },
    body: formData
  })
  let posted = await postedData.json()
  return posted

}
