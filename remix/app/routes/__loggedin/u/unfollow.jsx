import authenticator from "~/services/auth.server";
import * as mastodon from "~/models/tweets.server";
import { redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";

export const action = async ({request,params}) => {
    console.log("Got a post to /u/unfollow")
    let authUser = await authenticator.isAuthenticated(request, {
        throwOnError: true
    })
    let formData = await request.formData();
    let username = formData.get('username')
    let instance = formData.get('instance')
    console.log("Trying to fetch user",username,instance)
    let user = await mastodon.getOrFetchUserByUsername(username,instance)
    console.log("Trying to unfollow user ID",user.id)
    let unfollow = await mastodon.unfollowUserById(user.id,authUser.accessToken)
    console.log("Unfollow result",unfollow)
    return redirect(`/u/${username}@${instance}?unfollowed`)
}
