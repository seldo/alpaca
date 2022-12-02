import authenticator from "~/services/auth.server";
import * as mastodon from "~/models/tweets.server";
import { redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";

export const action = async ({request,params}) => {
    console.log("Got a post to /u/follow")
    let authUser = await authenticator.isAuthenticated(request, {
        throwOnError: true
    })
    let formData = await request.formData();
    let username = formData.get('username')
    let instance = formData.get('instance')
    console.log("Trying to fetch user",username,instance)
    let user = await mastodon.getOrFetchUserByUsername(username,instance)
    console.log("Trying to follow user ID",user.id)
    let follow = await mastodon.followUserById(user.id,authUser.accessToken)
    console.log("Follow result",follow)
    return redirect(`/u/${username}@${instance}?followed`)
}
