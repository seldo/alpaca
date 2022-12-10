import { authenticator, authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";

export const loader = async ({request}) => {
    console.log("/notifications_feed called")
    let authUser = await authenticateAndRefresh(request)
    const url = new URL(request.url);
    let minId = url.searchParams.get("minId");    
    if(minId == "null") minId = null
    console.log("/notification_feed requesting only past min id",minId)
    let notifications = await mastodon.getNotificationsRemote(authUser,minId)
    console.log("/notifications_feed got",notifications.length)
    let notificationString = JSON.stringify(notifications)
    return new Response(notificationString, {    
        status: 200
    });
}
