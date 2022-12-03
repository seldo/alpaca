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

const formatEvent = (event) => {
    switch(event.type) {
        case "favourite":
            return <div>
                {
                    (event.accounts.length == 1) ? <div>
                        {event.accounts[0].display_name} liked your tweet
                    </div> : (event.accounts.length == 2) ? <div>
                        {event.accounts[0].display_name} and {event.accounts[1].display_name} liked your tweet
                    </div> : <div>
                        {event.accounts[0].display_name} and {event.accounts.length-1} others liked your tweet
                    </div>
                }
                <div dangerouslySetInnerHTML={{__html: event.status.content}} />
            </div>
        case "mention":
            return <div>
                {event.account.display_name} mentioned you in a tweet:
                <div dangerouslySetInnerHTML={{__html: event.status.content}} />
            </div>
        case "follow":
            return <div>
                {
                    (event.accounts.length == 1) ? <div>
                        {event.accounts[0].display_name} followed you
                    </div> : (event.accounts.length == 2) ? <div>
                        {event.accounts[0].display_name} and {event.accounts[1].display_name} followed you
                    </div> : <div>
                        {event.accounts[0].display_name} and {event.accounts.length-1} others followed you.
                    </div>
                }
            </div>
    }
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
                { batchedNotifications.map( (n) => {
                    return <li key={`notifications_${n.id}`}>{formatEvent(n)}</li>
                })}
            </ul> : <div>Nothing has happened yet</div>
        }
    </div>
  
}  
