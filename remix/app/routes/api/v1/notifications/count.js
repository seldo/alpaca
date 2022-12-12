import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";

export const loader = async ({request}) => {
    console.log("/api/v1/notifications/count called")
    let authUser = await authenticateAndRefresh(request,{
        failureRedirect: "/"
    })
    const url = new URL(request.url);
    let minId = url.searchParams.get("minId");    
    if(minId == "null") minId = null
    if(minId == "undefined") minId = null
    let notifications = await mastodon.getNotificationsRemote(authUser,minId)
    console.log("/api/v1/notifications/count got",notifications.length)
    return {
        unreadCount: notifications.length
    }
}
