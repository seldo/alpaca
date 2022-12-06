import { redirect } from "@remix-run/node"; 
import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";

export const loader = async ({request}) => {
    let authUser = await authenticateAndRefresh(request)
    let user = await mastodon.getOrCreateUserFromData(authUser)
    return redirect(`/u/${user.username}@${user.instance}`)
}
