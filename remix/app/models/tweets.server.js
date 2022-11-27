import { prisma } from "../db.server";

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
