import * as mastodon from "~/models/posts.server";
import { authenticateAndRefresh } from "~/services/auth.server";

export const loader = async ({ request }) => {
    let authUser = await authenticateAndRefresh(request, {
        failureRedirect: "/api/v1/needauth",
        throwOnError: true
    })
    // TODO: we get the timeline no matter what, read ?timeline param and obey it
    let user = await mastodon.getOrCreateUserFromData(authUser)
    console.log(`/api/v1/user got ${authUser.username}@${authUser.instance}`)
    let localPosts = await mastodon.getTimelineLocal(user, { hydrate: true })
    return { user, localPosts }
}
