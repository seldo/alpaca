import { prisma } from "../db.server";
import authenticator from "../services/auth.server";

export async function getOrCreateUser(authUser) {
  // see if they're in the database
  let user = await prisma.user.findUnique({
    where: {
      id: authUser.id
    },
    include: {
      tweets: true,
    }
  })
  // if so return, otherwise insert them first
  if (!user) {
    user = await prisma.user.upsert({
      where: {
        id: authUser.id
      },
      update: {
        username: authUser.username,
        display_name: authUser.display_name,
        avatar: authUser.avatar,
        header: authUser.header,
        followers_count: authUser.followers_count,
        following_count: authUser.following_count
      },
      create: {
        id: authUser.id,
        username: authUser.username,
        display_name: authUser.display_name,
        avatar: authUser.avatar,
        header: authUser.header,
        followers_count: authUser.followers_count,
        following_count: authUser.following_count
      }
    })
  }
  return user
}

const storeTweets = async (tweets) => {
  return
}

/**
 * Fetches tweets, stores any that don't already exist in the database,
 * returns the timeline.
 * @param {} authUser 
 * @returns 
 */
export async function fetchTweets(authUser,minId) {
  // FIXME: surely there is going to be a smarter way than passing the authUser around
  let token = authUser.accessToken
  console.log(authUser.accessToken)
  let timelineData
  try {
    timelineData = await fetch(process.env.MASTODON_INSTANCE + `/api/v1/timelines/home${ minId ? `?minId=${minId}` : "" }`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
    let timeline = await timelineData.json()
    await storeTweets(timeline)
    // TODO: can we async this and just not wait?
    return timeline
  } catch (e) {
    console.log("Error fetching new tweets")
    console.log(timelineData)
    return []
  }
}
