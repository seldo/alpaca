import { prisma } from "../db.server";
import { getInstanceFromAccount } from "~/shared/components/tweet";

export async function getUserByUsername(username,instance,options = {
  withTweets: false
}) {
  // see if they're in the database
  let conditions = {
    where: {
      username_instance: {
        username,
        instance
      },
    }    
  }
  if(options.withTweets) {
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

export async function getOrFetchUserByUsername(username,instance,options = {
  withTweets: false,
  token: null
}) {
  let user = await getUserByUsername(username,instance,{withTweets:options.withTweets})
  if(!user) {
    // fetch them from the api; we must use webfinger because they aren't in the cache
    let userData = await fetch(process.env.MASTODON_INSTANCE + `/api/v1/accounts/lookup?acct=${username+"@"+instance+"&skip_webfinger=false"}`, {
      method: "GET"
    })
    // get user data
    user = await userData.json()
    // FIXME: ugly hack to match format of db
    user.json = JSON.parse(JSON.stringify(user))
    user.instance = getInstanceFromAccount(user)
    // store user data
    await getOrCreateUserFromData(user)
  }
  // they might have never tweeted, we might never have fetched their tweets, let's do it either way
  if(!user.tweets || (user.tweets && user.tweets.length == 0)) {   
    // get + store (public) user tweets
    // TODO: if we've got a token and are the user we should fetch private tweets too
    user.tweets = await getOrFetchTweetsByUserId(user.id)
  }
  return user
}

export async function getUserById(userId,options = {
  withTweets: false
}) {
  // see if they're in the database
  let conditions = {
    where: {
      id: userId
    }
  }
  if(options.withTweets) {
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
  if(user.tweets && user.tweets.length > 0 && user.tweets[0].json) {
    let formattedTweets = user.tweets.map( (t) => {
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
    return tweets.map( (t) => {
      t.account.instance = getInstanceFromAccount(t.account)
      return t
    })
  } else {
    return tweets
  }
}

export async function getOrCreateUserFromData(userData,options = {
    withTweets: false
  }) {
  let user = await getUserById(userData.id,{withTweets:options.withTweets})
  // if so return, otherwise insert them first
  if (!user) {
    let instance = getInstanceFromAccount(userData)
    user = await prisma.user.upsert({
      where: {
        id: userData.id
      },
      update: {
        username: userData.username,
        instance: instance,
        display_name: userData.display_name,
        avatar: userData.avatar,
        header: userData.header,
        json: userData
      },
      create: {
        id: userData.id,
        username: userData.username,
        instance: instance,
        display_name: userData.display_name,
        avatar: userData.avatar,
        header: userData.header,
        json: userData
      }
    })
  }
  return user
}

export const getTweetsByUserId = async(userId,options) => {
  let query = {
    where: {
      id: userId
    },
    orderBy: {
      seenAt: "desc"
    }    
  }

  let tweets = await prisma.timelineEntry.findMany(query)
  return tweets
}

export const getOrFetchTweetsByUserId = async(userId,options) => {
  // try to get them locally first
  let tweets = await getTweetsByUserId(userId)
  // if we get no tweets, we try to fetch them, but technically there might not be any
  if (tweets.length == 0) {
    tweets = await fetchTweetsByUserId(userId,options)
  }
  if(tweets) tweets = formatTweetUsers(tweets)
  return tweets
}

export const fetchTweetsByUserId = async(userId,options) => {
    let tweetData = await fetch(process.env.MASTODON_INSTANCE + `/api/v1/accounts/${userId}/statuses`, {
      method: "GET"
      // TODO: might want to get private tweets with token if authed
    })
    let tweets = await tweetData.json()
    if(tweets) tweets = formatTweetUsers(tweets)
    // now store them for later
    await storeTweets(tweets)
    return tweets
}

export const isFollowing = async(userToken,followingId) => {
  let followingRequestUrl = new URL(process.env.MASTODON_INSTANCE + "/api/v1/accounts/relationships")
  followingRequestUrl.searchParams.set('id',followingId)
  let followingData  = await fetch(followingRequestUrl.toString(), {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${userToken}`
    }  
  })
  let following = await followingData.json()
  if(following[0]) return following[0]
  else return null
}

const getOrCreateTweet = async(tweetData) => {
  // see if it's in the database
  let tweet = await prisma.tweet.findUnique({
    where: {
      id: tweetData.id
    }
  })
  // if so return, otherwise insert them first
  if (!tweet) {
    tweet = await prisma.tweet.upsert({
      where: {
        id: tweetData.id
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
const storeTweets = async (tweets) => {
  for(let i = 0; i < tweets.length; i++) {
    let tweetData = tweets[i]
    // reblogs are different
    // we store the reblog itself
    // and separately store the tweet they reblogged
    if (tweetData.reblog && tweetData.reblog.length > 0) {
      let rbAuthor = await getOrCreateUserFromData(tweetData.reblog.account)
      let rbTweet = await getOrCreateTweet(tweetData.reblog)
      tweetData.reblog = rbTweet.id
      // FIXME: we should add a reblogged field to the DB
      // and then we can fetch the reblogged tweets natively at fetch time
    }
    // TODO: can this be done totally async?
    let author = await getOrCreateUserFromData(tweetData.account)
    let tweet = await getOrCreateTweet(tweetData)
  }
  // FIXME: some sort of error catching...
  // TODO: a return value would be nice
  return
}

const storeTimeline = async (viewerId,timeline) => {

  // store the tweets themselves so we can satisfy db constraints
  await storeTweets(timeline)

  // now store these timeline entries
  let timelineBatch = []
  for(let i = 0; i < timeline.length; i++) {
    let tweet = timeline[i]
    timelineBatch.push({
      id: viewerId + ":" + tweet.id,
      seenAt: tweet.created_at,
      viewerId,
      tweetId: tweet.id
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

  let query = {
      where: {
        viewerId: userData.id
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

  if(options.hydrate) {
    // transform into full tweets
    let entries = timelineEntries.map( (entry) => {
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
export async function fetchTimeline (userData,minId) {
  // FIXME: surely there is going to be a smarter way than passing the userData around
  let token = userData.accessToken
  let timelineData
  try {
    timelineData = await fetch(process.env.MASTODON_INSTANCE + `/api/v1/timelines/home${ minId ? `?min_id=${minId}` : "" }`, {
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
      await storeTimeline(userData.id,timeline)
    } catch (e) {
      console.log("Error storing timeline",e)
    }
    return timeline
  } catch (e) {
    console.log("Error fetching new tweets",e)
    return []
  }
}

export const followUserById = async(followId,userToken) => {
  let followRequestUrl = new URL(process.env.MASTODON_INSTANCE + `/api/v1/accounts/${followId}/follow`)
  let followData  = await fetch(followRequestUrl.toString(), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${userToken}`
    }  
  })
  let follow = await followData.json()
  return follow
}

export const unfollowUserById = async(followId,userToken) => {
  console.log("Unfollowing using token auth",userToken)
  let followRequestUrl = new URL(process.env.MASTODON_INSTANCE + `/api/v1/accounts/${followId}/unfollow`)
  let followData  = await fetch(followRequestUrl.toString(), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${userToken}`
    }  
  })
  let follow = await followData.json()
  return follow
}

export const search = async(query,options = {token: null}) => {
  if (query === null) return false // why does mastodon search for null anyway?
  let searchUrl = new URL(process.env.MASTODON_INSTANCE + `/api/v2/search`)
  searchUrl.searchParams.set('q',query)
  searchUrl.searchParams.set('resolve',true)
  let searchData  = await fetch(searchUrl.toString(), {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${options.token}`
    }    
  })
  let searchResults = await searchData.json()
  if (searchResults.error) return false
  return searchResults
}

export const storeNotifications = async (notifications) => {
  /*
  // store all the notifications in one big transaction
  let timelineBatch = []
  for(let i = 0; i < timeline.length; i++) {
    let tweet = timeline[i]
    timelineBatch.push({
      id: viewerId + ":" + tweet.id,
      seenAt: tweet.created_at,
      viewerId,
      tweetId: tweet.id
    })
  }

  const storedTimelineEntries = await prisma.timelineEntry.createMany({
    data: timelineBatch,
    skipDuplicates: true
  })

  return
   */
  
  // TODO: this
  return
}

export const getNotificationsByUserId = async (userId) => {
  // TODO: actually get them
  return false
}

const parseThingId = (n) => {
  switch (n.type) {
    case "mention": return "mentioned_" + n.status.id
    case "status": return // FIXME: ignoring notifications for now
    case "reblog": return "reblogged_" + n.status.id
    case "follow": return "followed_you"
    case "follow_request": return n.account.id + "_requested_follow"
    case "favourite": return "favorited_" + n.status.id
    case "poll": return // FIXME: ignoring polls ending for now
    case "update": return // FIXME: ignoring status updates for now
  }
}

export const batchNotifications = async (notifications) => {
  let thingsReactedTo = {}
  // batch up by the thing they are reacting to
  for(let i = 0; i < notifications.length; i++) {
    let n = notifications[i]
    let nId = parseThingId(n)
    if (!thingsReactedTo[nId]) thingsReactedTo[nId] = []
    thingsReactedTo[nId].push(n)
  }
  // process each group of reactions
  let batches = []
  for(let trt of Object.values(thingsReactedTo)) {
    // everything is the same type so we can infer it from the first one
    let type = trt[0].type
    // get the events into most recent order
    trt.sort( (a,b) => {
      if (b.created_at > a.created_at) return 1
      else return -1  
    })
    let lastEvent = trt[0].created_at // credit the batch with the time of the most recent
    let notification = { type, lastEvent }
    switch(type) {
      case "favourite": // fuckin' "u"s
        // many people can favorite one status
        notification.status = trt[0].status
        notification.accounts = trt.map( (t) => {
          return t.account
        })
        break;
      case "mention":
        // only one person can mention you at a time
        notification.status = trt[0].status
        notification.account = trt[0].account
        break;
      case "follow":
        // many people can follow you
        notification.accounts = trt.map( (t) => {
          return t.account
        })
        break;
    }
    batches.push(notification)
  }
  // sort by lastEvent
  batches.sort( (a,b) => {
    if (b.lastEvent > a.lastEvent) return 1
    else return -1
  })
  return batches
}

export const getOrFetchNotifications = async (user) => {
  let notifications = await getNotificationsByUserId(user.id)
  if (!notifications) {
    let notificationsUrl = new URL(process.env.MASTODON_INSTANCE + `/api/v1/notifications`)
    notificationsUrl.searchParams.set('limit',200)
    let notificationsData  = await fetch(notificationsUrl.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${user.accessToken}`
      }    
    })
    notifications = await notificationsData.json()
    await storeNotifications(notifications)
  }
  return notifications
}
