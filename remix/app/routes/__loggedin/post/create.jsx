import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/tweets.server";
import { redirect } from "@remix-run/node";

export const action = async ({request,params}) => {
    let authUser = await authenticateAndRefresh(request)
    console.log("/post/create, access token",authUser.accessToken)

    let formData = await request.formData();
    let postText = formData.get('post')

    let post = await mastodon.createPost(authUser,{
        text: postText
    })

    // FIXME: you'll be able to post from all over
    // FIXME 2: maybe insert the post into the timeline immediately somehow?
    return redirect(`/home`)
}