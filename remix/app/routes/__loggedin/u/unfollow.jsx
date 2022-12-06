import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";
import { redirect } from "@remix-run/node";

export const action = async ({request,params}) => {
    console.log("Got a post to /u/unfollow")
    let authUser = await authenticateAndRefresh(request)
    let formData = await request.formData();
    let username = formData.get('username')
    let instance = formData.get('instance')
    let unfollow = await mastodon.unfollowUser(username,instance,authUser)
    console.log("Unfollow result",unfollow)
    return redirect(`/u/${username}@${instance}?unfollowed`)
}
