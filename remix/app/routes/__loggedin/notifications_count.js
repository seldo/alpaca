import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";

export const loader = async ({request}) => {
    console.log("/notifications_count called")
    let authUser = await authenticateAndRefresh(request,{
        failureRedirect: "/"
    })
    const url = new URL(request.url);
    let minId = url.searchParams.get("minId");    
    if(minId == "null") minId = null
    let notifications = await mastodon.getNotificationsRemote(authUser,minId)
    let notificationString = JSON.stringify({unreadCount:notifications.length})
    return new Response(notificationString, {
        status: 200
    })
}
