import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";
import { redirect } from "@remix-run/node";

export const action = async ({request,params}) => {
    let authUser = await authenticateAndRefresh(request)
    console.log("/post/create, access token",authUser.accessToken)

    let formData = await request.formData();
    let postText = formData.get('post')
    let inReplyTo = formData.get('inReplyTo')
    let done
    if(done = formData.get('done')) {
        if(done.indexOf('/') !== 0) done = false
    } else done = false

    let replyToId = null
    if(inReplyTo) {
        let parentPost = await mastodon.getPostRemote({postUniversalId: inReplyTo},authUser)
        replyToId = parentPost.id
    }

    let post = await mastodon.createPost(authUser,{
        text: postText,
        in_reply_to_id: replyToId
    })

    // FIXME: you'll be able to post from all over
    // FIXME 2: maybe insert the post into the timeline immediately somehow?
    return redirect( done || `/home`)
}
