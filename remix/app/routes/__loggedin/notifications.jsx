import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";
import { Post, batchNotifications } from "~/shared/components/post"
import { LinkToAccount } from "~/shared/components/post"
import { useEffect, useState } from "react";

export const loader = async ({request}) => {
    let authUser = await authenticateAndRefresh(request)
    let user = await mastodon.getOrCreateUserFromData(authUser)
    // TODO: we'll change this to just get and then use a fetcher to refresh
    let notifications = await mastodon.getOrFetchNotifications(authUser)
    let batchedNotifications = batchNotifications(notifications)

    return {user, notifications, batchedNotifications}
}

const formatEvent = (event) => {
    switch(event.type) {
        case "favourite":
            return <div className="notificationMessage notifyLike">
                {
                    (event.accounts.length == 1) ? <div className="notifyText">
                        <span className="displayName">{LinkToAccount(event.accounts[0])}</span> liked your post
                    </div> : (event.accounts.length == 2) ? <div className="notifyText">
                        <span className="displayName">{LinkToAccount(event.accounts[0])}</span> and <span className="displayName">{LinkToAccount(event.accounts[1])}</span> liked your post
                    </div> : <div className="notifyText">
                        <span className="displayName">{LinkToAccount(event.accounts[0])}</span> and {event.accounts.length-1} others liked your post
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
    const {user, notifications} = loaderData
    let batchedNotifications = batchNotifications(notifications)

    // set up a state newNotifications updated by setNotifications, initialized to notifications
    const [newNotifications,setNotifications] = useState(notifications)
    // when newNotifications is modified, update the state
    useEffect(() => {
        setNotifications(newNotifications)
        batchedNotifications = batchNotifications(newNotifications)
    },[newNotifications])
    // create a fetcher hook to get data in the background
    const fetcher = useFetcher();

    // set up an interval timer that uses fetcher to get notifications data
    useEffect(() => {
        const interval = setInterval( () => {
            // only refresh if the page is being viewed
            if(document.visibilityState === "visible") {
                // TODO: calculate minId from within notifications
                fetcher.load("/notifications_feed") // TODO: add minId as query param
            }
        }, 5000)
        // every time the fetcher is triggered (and also on first render) it creates a new timer
        return () => clearInterval(interval) // every time the timer goes off destroy the old one
    },[fetcher.data])

    // when the fetcher comes back with new data, parse it and push state
    useEffect( () => {
        if(fetcher.data) {
            let incoming = JSON.parse(fetcher.data)
            console.log("Incoming notification",incoming)
            let seenIds = []
            for(let i = 0; i < newNotifications.length; i++) {
              seenIds.push(newNotifications[i].id)
            }
            for(let i = 0; i < incoming.length; i++) {
              let n = incoming[i]
              if (!seenIds.includes(n.id)) {
                newNotifications.push(n)
              }
            }
            newNotifications.sort( (a,b) => {
              if(b.created_at > a.created_at) return 1
              else return -1
            })
            setNotifications(newNotifications)
        }
    },[fetcher.data])

    
    return <div className="notificationsPage">
        <div className="notificationsHeader">
            <h2>Notifications</h2>
        </div>
        { 
            (batchedNotifications && batchedNotifications.length > 0) ? <ul>
                { batchedNotifications.map( (n) => {
                    return <li key={`notifications_${n.type}_${n.lastEvent}`}>{formatEvent(n)}</li>
                })}
            </ul> : <div>Nothing has happened yet</div>
        }
    </div>
  
}  
