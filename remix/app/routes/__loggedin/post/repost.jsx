import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";
import { redirect } from "@remix-run/node";

export const action = async ({request,params}) => {
    console.log("/post/like")
    let authUser = await authenticateAndRefresh(request)

    let formData = await request.formData();
    let postUrl = formData.get('postUrl')

    let liked = await mastodon.rePost(postUrl,authUser)
    return liked
}
