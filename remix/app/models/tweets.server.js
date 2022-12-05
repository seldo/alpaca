import { prisma } from "~/db.server";
import { getInstanceFromAccount } from "~/shared/components/tweet";
import { redirect } from "@remix-run/node";

export async function getUserByUsername(username, instanceName, options = {
  withTweets: false
}) {
  console.log("Calling GibN 0",instanceName)
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
  let user = await prisma.user.findUnique(conditions)
  if (user) user = formatUserTweets(user)
  return user
}

export async function getOrFetchUserByUsername(username, instanceName, options = {
  withTweets: false,
  token: null
}) {
  let user = await getUserByUsername(username, instanceName, { withTweets: options.withTweets })
  if (!user) {
    // fetch them from the api; we must use webfinger because they aren't in the cache
    console.log("Calling GibN 1",instanceName)
    let instance = await getOrCreateInstanceByName(instanceName)
    console.log("GoFuBu looking for",username,"@",instanceName)
    let userData = await fetch(instance.url + `/api/v1/accounts/lookup?acct=${username + "@" + instanceName + "&skip_webfinger=false"}`, {
      method: "GET"
    })
    // get user data
    user = await userData.json()
    console.log("GoFuBu user",user)
    // FIXME: ugly hack to match format of db
    user.json = JSON.parse(JSON.stringify(user))
    user.instance = getInstanceFromAccount(user)
    // store user data
    await getOrCreateUserFromData(user)
  }
  // they might have never tweeted, we might never have fetched their tweets, let's do it either way
  if (!user.tweets || (user.tweets && user.tweets.length == 0)) {
    // get + store (public) user tweets
    // TODO: if we've got a token and are the user we should fetch private tweets too
    user.tweets = await getOrFetchTweetsByUserId(user.id, instanceName)
  }
  return user
}

// FIXME: we can be sure in any given call that this doesn't change
// so we can set a global var and not hit the db every time
export async function getOrCreateInstanceByName(instanceName) {
  let instance = await prisma.instance.findUnique({
    where: {
      name: instanceName
    }
  })
  if(!instance) {
    instance = await prisma.instance.create({
      data: {
        name: instanceName,
        url: "https://" + instanceName
      }
    })
  }
  return instance
}

export async function getUserById(userId, instanceName, options = {
  withTweets: false
}) {
  let instance = await getOrCreateInstanceByName(instanceName)
  console.log("Calling GibN 2",instanceName,"got",instance.id)

  // see if they're in the database
  let conditions = {
    where: {
      instanceId_id: {
        instanceId: instance.id,
        id: userId
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
  let user = await prisma.user.findUnique(conditions)
  if (user) user = formatUserTweets(user)
  return user
}

/**
 * Transform a user object's tweets into mastodon's richer format
 * @param {} user 
 * @returns 
 */
function formatUserTweets(user) {
  // only reformat if we haven't already done so
  if (user.tweets && user.tweets.length > 0 && user.tweets[0].json) {
    let formattedTweets = user.tweets.map((t) => {
      return t.json
    })
    user.tweets = formattedTweets
  }
  return user
}

/**
 * Transform mastodon's account object on each tweet to include an instance
 * @param {} tweets 
 */
function formatTweetUsers(tweets) {
  if (tweets && tweets.length > 0) {
    return tweets.map((t) => {
      t.account.instance = getInstanceFromAccount(t.account)
      return t
    })
  } else {
    return tweets
  }
}

export async function getOrCreateUserFromData(userData, options = {
  withTweets: false
}) {
  console.log("getOrCreateUserFromData called for",userData.username,'@',userData.instance)
  // first try fetching them from the database
  let user = await getUserById(userData.id, userData.instance, { withTweets: options.withTweets })
  // if so return, otherwise insert them first
  if (!user) {
    console.log("Calling GibN 3",userData.instance)
    let instance = await getOrCreateInstanceByName(userData.instance)
    user = await prisma.user.upsert({
      where: {
        instanceId_id: {
          instanceId: instance.id,
          id: userData.id
        }
      },
      update: {
        username: userData.username,
        instanceId: instance.id,
        display_name: userData.display_name,
        avatar: userData.avatar,
        header: userData.header,
        json: userData
      },
      create: {
        id: userData.id,
        instanceId: instance.id,
        username: userData.username,
        display_name: userData.display_name,
        avatar: userData.avatar,
        header: userData.header,
        json: userData
      }
    })
  }
  // since we want to return user.json and we already had it, just return userData
  return userData
}

export const getTweetsByUserId = async (userId, instanceName, options) => {
  console.log("Calling GibN 4",instanceName)
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

export const getOrFetchTweetsByUserId = async (userId, instanceName, options) => {
  // try to get them locally first
  let tweets = await getTweetsByUserId(userId, instanceName)
  // if we get no tweets, we try to fetch them, but technically there might not be any
  if (tweets.length == 0) {
    tweets = await fetchTweetsByUserId(userId, instanceName, options)
  }
  if (tweets) tweets = formatTweetUsers(tweets)
  return tweets
}

export const fetchTweetsByUserId = async (userId, instanceName, options) => {
  console.log("Calling GibN 5",instanceName)
  let instance = await getOrCreateInstanceByName(instanceName)
  let tweetData = await fetch(instance.url + `/api/v1/accounts/${userId}/statuses`, {
    method: "GET"
    // TODO: might want to get private tweets with token if authed
  })
  let tweets = await tweetData.json()
  if (tweets) tweets = formatTweetUsers(tweets)
  // now store them for later
  await storeTweets(tweets)
  return tweets
}

export const isFollowing = async (user, followingId, instanceName) => {
  console.log("Calling GibN 5a",user.instance)
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
  console.log("isFollowing data was",following)
  if (following[0]) return following[0]
  else return {following:false}
}

const getOrCreateTweet = async (tweetData,instanceId) => {
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

// FIXME: increase efficiency with a createMany/ignoreDuplicates here
const storeTweets = async (tweets,instance) => {
  for (let i = 0; i < tweets.length; i++) {
    let tweetData = tweets[i]
    // reblogs are different
    // we store the reblog itself
    // and separately store the tweet they reblogged
    if (tweetData.reblog && tweetData.reblog.length > 0) {
      let rbAuthor = await getOrCreateUserFromData(tweetData.reblog.account)
      let rbInstance = await getOrCreateInstanceByName(getInstanceFromAccount(tweetData.reblog.account))
      let rbTweet = await getOrCreateTweet(tweetData.reblog,rbInstance.id)
      tweetData.reblog = rbTweet.id
      // FIXME: we should add a reblogged field to the DB
      // and then we can fetch the reblogged tweets natively at fetch time
    }
    // TODO: can this be done totally async?
    let author = await getOrCreateUserFromData(tweetData.account)
    let authorInstance = await getOrCreateInstanceByName(getInstanceFromAccount(tweetData.account))
    let tweet = await getOrCreateTweet(tweetData,authorInstance.id)
  }
  // FIXME: some sort of error catching...
  // TODO: a return value would be nice
  return
}

const storeTimeline = async (viewerId, instanceName, timeline) => {
  console.log(`Called storeTimeline for viewed ${viewerId} instance name ${instanceName}`)
  // store the tweets themselves so we can satisfy db constraints
  console.log("Calling GibN 6",instanceName)
  let instance = await getOrCreateInstanceByName(instanceName)
  await storeTweets(timeline,instance)

  // now store these timeline entries
  let timelineBatch = []
  for (let i = 0; i < timeline.length; i++) {
    let tweet = timeline[i]
    // oh my god this is horribly inefficient
    // we have to find an instance ID for each tweet individually
    let tweetInstance = await getOrCreateInstanceByName(getInstanceFromAccount(tweet.account))
    timelineBatch.push({
      id: viewerId + ":" + tweet.id,
      instanceId: instance.id,
      seenAt: tweet.created_at,
      viewerId,
      tweetId: tweet.id,
      tweetInstanceId: tweetInstance.id
    })
  }

  const storedTimelineEntries = await prisma.timelineEntry.createMany({
    data: timelineBatch,
    skipDuplicates: true
  })

  return

}

/**
 * Gets the most recent tweets in the user's timeline
 * @param {} userData   User object must include .id
 * @param {*} options 
 *    hydrate   boolean Whether to hydrate the tweets 
 * @returns array of tweet IDs (default) or full tweets (if hydrate=true)
 */
export const getTimeline = async (userData, options = {
  hydrate: false
}) => {
  console.log("Calling GibN 7",userData.instance)
  let instance = await getOrCreateInstanceByName(userData.instance)

  let query = {
    where: {
      instanceId: instance.id,
      AND: {
        viewerId: userData.id
      }
    },
    orderBy: {
      seenAt: "desc"
    }
  }
  if (options.hydrate) {
    query.include = {
      tweet: true
    }
  }

  let timelineEntries = await prisma.timelineEntry.findMany(query)

  if (options.hydrate) {
    // transform into full tweets
    let entries = timelineEntries.map((entry) => {
      return entry.tweet.json
    })
    let timeline = formatTweetUsers(entries)
    return timeline
  } else {
    return timelineEntries
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
export async function fetchTimeline(userData, minId) {
  // FIXME: surely there is going to be a smarter way than passing the userData around
  let token = userData.accessToken
  let timelineData
  try {
    console.log("Calling GibN 7a",userData.instance)
    let instance = await getOrCreateInstanceByName(userData.instance)  
    timelineData = await fetch(instance.url + `/api/v1/timelines/home${minId ? `?min_id=${minId}` : ""}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
    let timelineRaw = await timelineData.json()
    // format it
    let timeline = formatTweetUsers(timelineRaw)
    try {
      // TODO: can we async this and just not wait?
      await storeTimeline(userData.id, userData.instance, timeline)
    } catch (e) {
      console.log("Error storing timeline", e)
    }
    return timeline
  } catch (e) {
    console.log("Error fetching new tweets", e)
    return []
  }
}

export const followUserById = async (followId, instanceName, userToken) => {
  console.log("Calling GibN 7b",instanceName)
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
  console.log("Calling GibN 7c",instanceName)
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

export const search = async (query, options = { token: null }) => {
  if (query === null) return false // why does mastodon search for null anyway?
  console.log("Calling GibN 7d",options.instanceName)
  let instance = await getOrCreateInstanceByName(options.instanceName)
  let searchUrl = new URL(instance.url + `/api/v2/search`)
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
  return searchResults
}

export const storeNotifications = async (notifications, forWhom, instanceName) => {
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
  console.log("Calling GibN 7e",user.instance)
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
  console.log("Calling GibN 7e2",instanceName)
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
  let notifications = await getNotificationsByUserId(user.id,user.instance)
  if (!notifications) {
    notifications = fetchAndStoreNotifications(user)
  }
  return notifications
}

export const createPost = async (user, data = {text:null}) => {
  console.log("Calling GibN 8",user.instance)
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
