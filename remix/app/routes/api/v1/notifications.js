import { authenticator, authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";

export const loader = async ({request}) => {
    console.log("/api/v1/notifications called")
    let authUser = await authenticateAndRefresh(request)
    const url = new URL(request.url);
    let minId = url.searchParams.get("minId");    
    if(minId == "null") minId = null
    if(minId == "undefined") minId = null
    console.log("/api/v1/notifications requesting only past min id",minId)
    let notifications = await mastodon.getNotificationsRemote(authUser,minId)
    console.log("/api/v1/notifications got",notifications.length)
    return notifications
}
