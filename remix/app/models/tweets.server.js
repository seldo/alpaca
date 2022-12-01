import { prisma } from "../db.server";

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
      tweets: true
    }
  }
  let user = await prisma.user.findUnique(conditions)  
  if (user) user = formatUserTweets(user)
  return user
}

export async function getOrFetchUserByUsername(username,instance,options = {
  withTweets: false,
  token
}) {
  let user = await getUserByUsername(username,instance,{withTweets:options.withTweets})
  if(!user) {
    // fetch them from the api; we must use webfinger because they aren't in the cache
    userData = await fetch(process.env.MASTODON_INSTANCE + `/api/v1/accounts/lookup?acct=${username+"@"+instance+"&skip_webfinger=false"}`, {
      method: "GET"
    })
    // get user data
    user = await userData.json()
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
      tweets: true
    }
  }
  let user = await prisma.user.findUnique(conditions)  
  if (user) user = formatUserTweets(user)
  return user
}

function getInstanceFromData(userData) {
  let acctInstance = userData.acct.split('@')[1]
  if (acctInstance) return acctInstance
  let urlInstance = userData.url.split('//')[1].split('/')[0]
  return urlInstance
}

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

export async function getOrCreateUserFromData(userData,options = {
    withTweets: false
  }) {
  let user = await getUserById(userData.id,{withTweets:options.withTweets})
  // if so return, otherwise insert them first
  if (!user) {
    let instance = getInstanceFromData(userData)
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
        followers_count: userData.followers_count,
        following_count: userData.following_count
      },
      create: {
        id: userData.id,
        username: userData.username,
        instance: instance,
        display_name: userData.display_name,
        avatar: userData.avatar,
        header: userData.header,
        followers_count: userData.followers_count,
        following_count: userData.following_count
      }
    })
  }
  return user
}

export const getTweetsByUserId = async(userId,options) => {
  let query = {
    where: {
      id: userId
    }
    // TODO: orderby
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
  if(tweets) tweets = formatUserTweets(tweets)
  return tweets
}

export const fetchTweetsByUserId = async(userId,options) => {
    let tweetData = await fetch(process.env.MASTODON_INSTANCE + `/api/v1/accounts/${userId}/statuses`, {
      method: "GET"
      // TODO: might want to get private tweets with token if authed
    })
    let tweets = await tweetData.json()
    if(tweets) tweets = formatUserTweets(tweets)
    // now store them for later
    await storeTweets(tweets)
    return tweets
}

export const isFollowing = async(userToken,followingId) => {
  followingId = '109382405233051756'
  console.log("Looking for",followingId)
  console.log("Token is",userToken)
  let followingRequestUrl = new URL(process.env.MASTODON_INSTANCE + "/api/v1/accounts/relationships")
  followingRequestUrl.searchParams.set('id',followingId)
  console.log("Request url",followingRequestUrl.toString())
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
        authorId: tweetData.account.id,
        json: tweetData
      },
      create: {
        id: tweetData.id,
        permalink: tweetData.url ? tweetData.url : tweetData.uri,
        text: tweetData.content,
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
    return entries
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
    let timeline = await timelineData.json()
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
