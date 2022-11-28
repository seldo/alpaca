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
export async function fetchTweets(authUser) {
  // FIXME: surely there is going to be a smarter way than passing the authUser around
  let token = authUser.accessToken
  console.log(authUser.accessToken)
  let timelineData = await fetch(process.env.MASTODON_INSTANCE + "/api/v1/timelines/home", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
  let timeline = await timelineData.json()
  console.log(timeline[0])
  //await storeTweets(timeline)
  // let timeline = Array(3)
  // for(let i = 0; i < timeline.length; i++) {
  //   timeline[i] = {
  //     account: {
  //       display_name: Math.random(),
  //       acct: Math.random()
  //     },
  //     content: "Content: " + Math.random(),
  //     replies_count: Math.random(),
  //     reblogs_count: Math.random(),
  //     favourites_count: Math.random()
  //   }
  // }
  // await new Promise(r => setTimeout(r, 1200));
  // TODO: can we async this and just not wait?
  return timeline
}
