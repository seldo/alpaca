import { redirect } from "@remix-run/node"; 
import authenticator from "~/services/auth.server";
import * as mastodon from "~/models/tweets.server";

export const loader = async ({request}) => {
    let authUser = await authenticator.isAuthenticated(request)
    let user = await mastodon.getOrCreateUserFromData(authUser)
    return redirect(`/u/${user.username}@${user.instance}`)
}
