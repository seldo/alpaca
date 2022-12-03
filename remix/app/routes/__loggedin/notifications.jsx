import { useLoaderData, useFetcher } from "@remix-run/react";
import authenticator from "~/services/auth.server";
import * as mastodon from "~/models/tweets.server";
import Tweet from "~/shared/components/tweet"
import { Link } from "react-router-dom";
import { LinkToAccount } from "~/shared/components/tweet"

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
            console.log("event",event)
            return <div className="notificationMessage notifyLike">
                {
                    (event.accounts.length == 1) ? <div className="notifyText">
                        <span className="displayName">{LinkToAccount(event.accounts[0])}</span> liked your tweet
                    </div> : (event.accounts.length == 2) ? <div className="notifyText">
                        <span className="displayName">{LinkToAccount(event.accounts[0])}</span> and <span className="displayName">{LinkToAccount(event.accounts[1])}</span> liked your tweet
                    </div> : <div className="notifyText">
                        <span className="displayName">{LinkToAccount(event.accounts[0])}</span> and {event.accounts.length-1} others liked your tweet
                    </div>
                }
                {Tweet(event.status,{avatar:false})}
            </div>
        case "mention":
            return <div className="notificationMessage notifyMention">
                {Tweet(event.status)}
            </div>
        case "follow":
            return <div className="notificationMessage notifyFollow">
                {
                    (event.accounts.length == 1) ? <div className="notifyText">
                        <span className="displayName">{LinkToAccount(event.accounts[0])}</span> followed you
                    </div> : (event.accounts.length == 2) ? <div className="notifyText">
                        <span className="displayName">{LinkToAccount(event.accounts[0])}</span> and <span className="displayName">{LinkToAccount(event.accounts[1])}</span> followed you
                    </div> : <div className="notifyText">
                        <span className="displayName">{LinkToAccount(event.accounts[0])}</span> and {event.accounts.length-1} others followed you.
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
