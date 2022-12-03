import { useLoaderData, useFetcher } from "@remix-run/react";
import authenticator from "~/services/auth.server";
import * as mastodon from "~/models/tweets.server";

export const loader = async ({request}) => {
    let authUser = await authenticator.isAuthenticated(request)
    let user = await mastodon.getOrCreateUserFromData(authUser)
    // TODO: we'll change this to just get and then use a fetcher to refresh
    let notifications = await mastodon.getOrFetchNotifications(authUser)
    let batchedNotifications = await mastodon.batchNotifications(notifications)

    return {user, batchedNotifications}
}

export default function Index() {
    const loaderData = useLoaderData();
    const {user, batchedNotifications} = loaderData
    
    return <div className="notificationsPage">
        <div className="notificationsHeader">
            <h2>Notifications</h2>
        </div>
        { 
            (batchedNotifications && batchedNotifications.length > 0) ? <ul>
                { notifications.map( (n) => {
                    console.log(n)
                    return <li key={`notifications_${n.id}`}>
                        {n.toString()}
                    </li>
                })}
            </ul> : <div>Nothing has happened yet</div>
        }
    </div>
  
}  
