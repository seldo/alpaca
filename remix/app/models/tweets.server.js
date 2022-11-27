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

export async function fetchTweets(authUser) {
  // FIXME: surely there is going to be a smarter way than passing this around
  let token = authUser.accessToken
  console.log(authUser)
  let timeline = await fetch(process.env.MASTODON_INSTANCE + "/api/v1/timelines/home", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
  return await timeline.json()
}
