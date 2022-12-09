import { prisma } from "~/db.server";
import { getInstanceFromAccount, createPostHash } from "~/shared/components/post";
import { redirect } from "@remix-run/node";
import { authenticator } from "~/services/auth.server"

// FIXME: it's sort of debatable that we need this except as a cache for later?
// we already have all the data from the verification call
export const getOrCreateUserFromData = async (userData, options = {
  withPosts: false
}) => {
  console.log("getOrCreateUserFromData")
  // first try fetching them from the database
  let user = await getUserLocal(userData, { withPosts: options.withPosts })
  // if we don't find them we store them
  if (!user) {
    console.log(`getOrCreateUserFromData: ${userData.username}@${userData.instance} not found`)
    await createUser(userData)
  }
  // since we want to return user.json and we already had it, just return userData
  return userData
}

export const createUser = async (userData) => {
  let user
  try {
    user = await prisma.user.create({
      data: {
        username: userData.username,
        userInstance: userData.instance,
        display_name: userData.display_name,
        json: userData
      }
    })
  } catch(e) {
    if(e.code = 'P2002') {
      // user already existed, no need to create
      return userData
    } else {
      console.error(`Error storing user ${userData.username}@${userData.instance}`)
      console.log(e)
      return false
    }
  }
  return user
}

export const getUserLocal = async (user, options = {
  withPosts: false
}) => {
  console.log(`getUserLocal ${user.username}@${user.instance}`)

  // see if they're in the database
  let conditions = {
    where: {
      username_userInstance: {
        username: user.username,
        userInstance: user.instance
      }
    }
  }
  if (options.withPosts) {
    conditions.include = {
      posts: {
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
  let foundUser = await userData.json
  foundUser.posts = userData.posts
  foundUser = formatUserPosts(foundUser)
  foundUser.instance = getInstanceFromAccount(foundUser)
  console.log(`getUserLocal: found user ${foundUser.username}@${foundUser.instance}`)
  return foundUser
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

export async function getOrCreateUser(username,userInstance,authUser,options = {
  withPosts: false
}) {
  // first try local
  let user = await getUserLocal({username,instance:userInstance},options)
  // if not local then fetch
  if (!user) {
    user = await getUserRemote(username,userInstance,authUser,options)
    // if they wanted posts we must remote-fetch those separately now
    if (options.withPosts) {
      // we make use of the fact that we just fetched the remote user so we have their id
      user.posts = await getPostsRemote(user,authUser)
    }
  }
  // FIXME: there is probably some difference between the local and remote formats?
  return user
}

export const getPostsRemote = async (remoteUser,authUser) => {
  console.log("getPostsRemote")
  // getting posts unfortunately requires knowing the user's internal ID
  let postsUrl = new URL(getInstanceUrl(authUser.instance) + `/api/v1/accounts/${remoteUser.id}/statuses`)
  let postData = await fetch(postsUrl, {
    method: "GET"
    // TODO: might want to get private posts with token if authed
  })
  let posts = await postData.json()
  if(!posts) {
    console.log(`getPostsRemote did not find any posts`)
    return false
  }
  if(posts.error) {
    throw new Error(`getRemotePosts hit error fetching posts for ${remoteUser.id}`)
  }
  // successfully fetched! Store them
  await storePosts(posts)
  // format them nicely
  if (posts) posts = formatPostUsers(posts)
  // and put them in the cache as we do on anything remote
  return posts
}

export async function getUserRemote(username, userInstance, authUser) {
  console.log("getUserRemote")
  // we must use webfinger because they probably aren't in our cache
  let userUrl = new URL(getInstanceUrl(authUser.instance) + `/api/v1/accounts/lookup`)
  userUrl.searchParams.append("acct",`${username}@${userInstance}`)
  userUrl.searchParams.append("skip_webfinger",false)
  let userData = await fetch(userUrl, {
    method: "GET"
  })
  let user = await userData.json()
  if(!user) {
    console.log(`getUserRemote did not find ${username}@${userInstance}`)
    return false
  }
  if(user.error) {
    throw new Error(`getUserRemote hit error fetching ${username}@${userInstance}`)
  }
  user.instance = userInstance
  // fetched, so store, as with all remote calls
  await createUser(user)
  return user
}

/**
 * Gets the most recent posts in the user's timeline
 * @param {} userData   User object must include username and instance
 * @param {*} options 
 *    hydrate   boolean Whether to hydrate the posts
 * @returns array of post IDs (default) or full posts (if hydrate=true)
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
    },
    take: 100
  }
  if (options.hydrate) {
    query.include = {
      post: true
    }
  }

  let timelineEntries = await prisma.timelineEntry.findMany(query)

  // transform into full posts
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
 * @param {} posts
 */
 function formatPostUsers(posts) {
  if (posts && posts.length > 0) {
    return posts.map((t) => {
      t.account.instance = getInstanceFromAccount(t.account)
      if(t.reblog) {
        t.reblog.account.instance = getInstanceFromAccount(t.reblog.account)
      }
      return t
    })
  } else {
    console.log("Did not format posts")
    return posts
  }
}

/**
 * Fetches a user's timeline from the remote Mastodon instance. 
 * Stores the timeline entries in the timeline cache, and stores 
 * any posts and authors we haven't seen before into those caches.
 * @param {}      userData  Must contain an .id and .accessToken property
 * @param String  minId     Posts before this ID will not be fetched
 * @returns array of fully-hydrated posts including RPs.
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
  let storedInstances = await storeInstances(instances)
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
  console.log("storeInstances")
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

export const search = async(query,user,options = {
  // type
  // resolve
  // following
  // account_id
  // max_id
  // min_id
}) => {
  let searchUrl = new URL(getInstanceUrl(user.instance) + `/api/v2/search`)
  searchUrl.searchParams.set('q', query)
  if(options.resolve) {
    searchUrl.searchParams.set('resolve', true)
  }
  if(options.type) {
    searchUrl.searchParams.set('type',options.type)
  }
  // TODO the rest of those
  try {
    let searchData = await fetch(searchUrl.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${user.accessToken}`
      }
    })
    let searchResults = await searchData.json()
    if (searchResults.error) {
      console.log(`Search results for "${query}" returned error`,searchResults.error)
      return false
    }
    return searchResults
  } catch(e) {
    console.log(`Search method threw error`,e)
    return false
  }
}

export const searchAll = async (query, user) => {
  console.log("search")
  if (query === null) return false // why does mastodon search for null anyway?
  let searchResults = search(query, user, {
    resolve: true
  })
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

export const getNotificationsLocal = async (user,instanceName) => {
  console.log("GetNotificationsLocal")
  let query = {
    where: {
      viewerName: user.username,
      AND: {
        viewerInstance: user.instance
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

export const getNotificationsRemote = async (user, minId = null) => {
  console.log("fetchNotificationsRemote")
  let notificationsUrl = new URL(getInstanceUrl(user.instance) + `/api/v1/notifications`)
  notificationsUrl.searchParams.set('limit', 200)
  if (minId !== null) notificationsUrl.searchParams.set('min_id', minId)
  let notificationsData = await fetch(notificationsUrl.toString(), {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${user.accessToken}`
    }
  })
  // FIXME: everyone should be doing this probably
  if (notificationsData.status != "200") forceAuthRefresh()
  let notifications = await notificationsData.json()
  if (notifications.error) forceAuthRefresh()
  // format the notifications
  notifications = notifications.map( (n) => {
    n.account.instance = getInstanceFromAccount(n.account)
    return n
  })
  let storedNotifications = await storeNotifications(notifications, user)
  return notifications
}

const forceAuthRefresh = () => {
  throw redirect('/auth/mastodon')
}

export const storeNotifications = async (notifications, user) => {
  console.log("storeNotifications")
  // store all the notifications in one big transaction
  let batchInsert = []
  for (let i = 0; i < notifications.length; i++) {
    let n = notifications[i]
    batchInsert.push({
      createdAt: n.created_at,
      type: n.type,
      json: n,
      hash: createNotificationHash(n),
      viewerName: user.username,
      viewerInstance: user.instance
    })
  }

  const storedNotifications = await prisma.notification.createMany({
    data: batchInsert,
    skipDuplicates: true
  })

  return storedNotifications
}

const createNotificationHash = (n) => {
  // FIXME: when we figure out in-browser crypto we should do some
  // until then...
  let hashMessage = n.account.username + ":" +
        n.account.instance + ":" +
        n.type + ":" +
        n.created_at
  return hashMessage
}

export const isFollowing = async (username, userInstance,authUser) => {
  console.log(`isFollowing looking for ${username}@${userInstance}`)
  // we need their internal id; local doesn't have this
  // that's because the same user can have infinity internal IDs
  // depending which server you're logged into when you look them up
  // bummer!
  let user = await getUserRemote(username,userInstance,authUser)
  let followingRequestUrl = new URL(getInstanceUrl(authUser.instance) + "/api/v1/accounts/relationships")
  followingRequestUrl.searchParams.set('id', user.id)
  let followingData = await fetch(followingRequestUrl.toString(), {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${authUser.accessToken}`
    }
  })
  let following = await followingData.json()
  // unlike most remotes, we don't store the user graph so we don't store this.
  if (following[0]) return following[0]
  else return {
    following:false
  }
}

export const followUser = async (username, userInstance, authUser) => {
  console.log("FollowUser")
  // we need their local instance ID for this
  let user = await getUserRemote(username,userInstance,authUser)

  let followRequestUrl = new URL(getInstanceUrl(authUser.instance) + `/api/v1/accounts/${user.id}/follow`)

  let followData = await fetch(followRequestUrl.toString(), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${authUser.accessToken}`
    }
  })
  let follow = await followData.json()
  return follow
}

export const unfollowUser = async (username, userInstance, authUser) => {
  console.log("UnfollowUser")
  // we need their local instance ID for this
  let user = await getUserRemote(username,userInstance,authUser)

  let unfollowRequestUrl = new URL(getInstanceUrl(authUser.instance) + `/api/v1/accounts/${user.id}/unfollow`)

  let unfollowData = await fetch(unfollowRequestUrl.toString(), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${authUser.accessToken}`
    }
  })
  let unfollow = await unfollowData.json()
  return unfollow
}

export const createPost = async (user, data = {text:null}) => {
  console.log("createPost")
  let postUrl = new URL(getInstanceUrl(user.instance) + `/api/v1/statuses`)
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

export const likePost = async (postUrlString, authUser) => {
  
  let searchResults = await search(postUrlString,authUser,{
    type: 'statuses',
    resolve: true
  })
  if(!searchResults.statuses[0]) {
    throw new Error(`Like could not find post ${postUrlString} to like it`)
  }
  let post = searchResults.statuses[0]

  let likeUrl = new URL(getInstanceUrl(authUser.instance) + `/api/v1/statuses/${post.id}/favourite`)
  let likedData = await fetch(likeUrl.toString(), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${authUser.accessToken}`
    }
  })
  let liked = await likedData.json()
  if(liked.error) {
    console.log(`Liking post ${postUrlString} resulted in an error`,liked.error)
    return false
  }
  // this is the entire post
  return liked
}

export const rePost = async (postUrlString, authUser) => {
  
  let searchResults = await search(postUrlString,authUser,{
    type: 'statuses',
    resolve: true
  })
  if(!searchResults.statuses[0]) {
    throw new Error(`Like could not find post ${postUrlString} to like it`)
  }
  let post = searchResults.statuses[0]

  let repostUrl = new URL(getInstanceUrl(authUser.instance) + `/api/v1/statuses/${post.id}/reblog`)
  let repostData = await fetch(repostUrl.toString(), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${authUser.accessToken}`
    }
  })
  let reposted = await repostData.json()
  if(reposted.error) {
    console.log(`Reposting ${postUrlString} resulted in an error`,reposted.error)
    return false
  }
  // this is the entire post
  return reposted
}

export const getPostRemote = async(postId = {
  postUrl,       //   either
  username,      //}
  userInstance,  // } or
  postId         //}
},authUser) => {
  // we don't know the internal ID so we have to resolve that first via search
  let postUrlString
  if(postId.postUrl) { // TODO: regex
    postUrlString = postId.postUrl
  } else if (postId.username && postId.userInstance && postId.postId) {
    postUrlString = `${getInstanceUrl(postId.userInstance)}/@${postId.username}/${postId.postId}`
    console.log(postUrlString)
  } else {
    console.log("got post identity",postId)
    throw new Error("getPostRemote could not format a postUrlString")
  }
  let searchResults = await search(postUrlString,authUser,{
    type: 'statuses',
    resolve: true
  })
  if(!searchResults.statuses[0]) {
    throw new Error(`getPostRemote could not find post ${postUrlString}`)
  }
  return searchResults.statuses[0]
  
}

// FIXME: we should be storing every tweet in the thread and loading local-first
export const getThreadRemote = async(postId = {
    postUrl,       //   either
    username,      //}
    userInstance,  // } or
    postId         //}
  },authUser) => {
    console.log("getThreadRemote")
    let post = await getPostRemote(postId,authUser)
    // now we have the internal ID so we can get all the goodies
    let threadUrl = new URL(getInstanceUrl(authUser.instance) + `/api/v1/statuses/${post.id}/context`)
    let threadData = await fetch(threadUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${authUser.accessToken}`
      }
    })
    let thread = await threadData.json()
    if(!thread) {
      throw new Error("Did not find thread for post ID " + post.id)
    }
    if(thread.error) {
      throw new Error(`Error retrieving thread for ${post.id}`)
    }
    thread.post = post
    return thread

}
