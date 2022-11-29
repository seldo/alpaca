import { prisma } from "../db.server";
import authenticator from "../services/auth.server";

export async function getOrCreateUser(userData) {
  // see if they're in the database
  let user = await prisma.user.findUnique({
    where: {
      id: userData.id
    }
  })
  // if so return, otherwise insert them first
  if (!user) {
    user = await prisma.user.upsert({
      where: {
        id: userData.id
      },
      update: {
        username: userData.username,
        display_name: userData.display_name,
        avatar: userData.avatar,
        header: userData.header,
        followers_count: userData.followers_count,
        following_count: userData.following_count
      },
      create: {
        id: userData.id,
        username: userData.username,
        display_name: userData.display_name,
        avatar: userData.avatar,
        header: userData.header,
        followers_count: userData.followers_count,
        following_count: userData.following_count
      }
    })
  }
  // if the user has tweets make sure they fit our expected format
  if(user.tweets) {
    let formattedTweets = user.tweets.map( (t) => {
      return t.json
    })
    user.tweets = formattedTweets
  }
  return user
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
      let rbAuthor = await getOrCreateUser(tweetData.reblog.account)
      let rbTweet = await getOrCreateTweet(tweetData.reblog)
      tweetData.reblog = rbTweet.id
      // FIXME: we should add a reblogged field to the DB
      // and then we can fetch the reblogged tweets natively at fetch time
    }
    let author = await getOrCreateUser(tweetData.account)
    let tweet = await getOrCreateTweet(tweetData)
  }
  // FIXME: some sort of error catching...
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
    // console.log("Hydrating timeline from ")
    // console.log(timelineEntries[0])
    let entries = timelineEntries.map( (entry) => {
      return entry.tweet.json
    })
    // console.log("to")
    // console.log(entries[0])
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
    timelineData = await fetch(process.env.MASTODON_INSTANCE + `/api/v1/timelines/home${ minId ? `?minId=${minId}` : "" }`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
    let timeline = await timelineData.json()
    try {
      await storeTimeline(userData.id,timeline)
    } catch (e) {
      console.log("Error storing timeline")
      console.log(e)
    }
    // TODO: can we async this and just not wait?
    //console.log(timeline)
    return timeline
  } catch (e) {
    console.log("Error fetching new tweets")
    //console.log(timelineData)
    console.log(e)
    return []
  }
}
