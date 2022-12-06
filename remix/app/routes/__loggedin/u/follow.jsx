import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";
import { redirect } from "@remix-run/node";

export const action = async ({request,params}) => {
    console.log("/u/follow")
    let authUser = await authenticateAndRefresh(request)
    let formData = await request.formData();
    let username = formData.get('username')
    let instance = formData.get('instance')
    let follow = await mastodon.followUser(username,instance,authUser)
    console.log("Follow result",follow)
    return redirect(`/u/${username}@${instance}?followed`)
}
