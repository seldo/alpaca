import { prisma } from "../db.server";
import authenticator from "../services/auth.server";

export async function getOrCreateUser(userData) {
  // see if they're in the database
  let user = await prisma.user.findUnique({
    where: {
      id: userData.id
    },
    include: {
      tweets: true,
      // FIXME: this cannot possibly scale, how do we limit?
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
      // id: autogen
      // seenAt: autogen // FIXME: danger will robinson
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
 * Fetches a user's timeline. Stores the timeline entries so we can
 * reconstruct it, and stores any tweets and authors we haven't seen
 * before into the tweets cache.
 * returns the timeline.
 * @param {} userData 
 * @returns 
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
