import { authenticator, authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";

export const loader = async ({request}) => {
    console.log("/notifications_feed called")
    let authUser = await authenticateAndRefresh(request)
    const url = new URL(request.url);
    let minId = url.searchParams.get("minId");    
    if(minId == "null") minId = null
    let notifications = await mastodon.fetchAndStoreNotifications(authUser,minId)
    let notificationString = JSON.stringify(notifications)
    return new Response(notificationString, {    
        status: 200
    });
}
