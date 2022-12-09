import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";
import { Post, batchNotifications, reactionClick, reactionState, reactionData } from "~/shared/components/post"
import { LinkToAccount } from "~/shared/components/post"
import { useEffect, useState } from "react";

const NOTIFICATONS_FETCH_INTERVAL = 15
const MIN_ID = "notifications_most_recent_id" // FIXME: exists in two places

export const loader = async ({request}) => {
    let authUser = await authenticateAndRefresh(request)
    let user = await mastodon.getOrCreateUserFromData(authUser)
    let notifications = await mastodon.getNotificationsLocal(authUser)
    let batchedNotifications = batchNotifications(notifications)

    return {user, notifications, batchedNotifications}
}

const formatEvent = (event,fetcher) => {
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
                {Post(event.status,{avatar:false,fetcher,handleLike:reactionClick})}
            </div>
        case "mention":
            return <div className="notificationMessage notifyMention">
                {Post(event.status,{avatar:true,fetcher,handleLike:reactionClick})}
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
                let feedUrl = "/notifications_feed"
                if(window && window.localStorage) {
                    if(window.localStorage[MIN_ID]) {
                        feedUrl += "?minId=" + window.localStorage[MIN_ID]
                    }
                }
                fetcher.load(feedUrl)
            }
        }, NOTIFICATONS_FETCH_INTERVAL * 1000)
        // every time the fetcher is triggered (and also on first render) it creates a new timer
        return () => clearInterval(interval) // every time the timer goes off destroy the old one
    },[fetcher.data])

    // when the fetcher comes back with new data, parse it and push state
    useEffect( () => {
        if(fetcher.data) {
            let incoming
            try {
                incoming = JSON.parse(fetcher.data)
            } catch(e) {
                // ignore it because it's coming from a like button or summat
                return
            }
            //console.log("Incoming notification",incoming)
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
            // storing state across pages
            if(window && window.localStorage && newNotifications.length > 0) {
                window.localStorage[MIN_ID] = newNotifications[0].id   
            }
            setNotifications(newNotifications)
        }
    },[fetcher.data])

    useEffect(() => {
        reactionState()
    }, [fetcher.state])
    
    return <div className="notificationsPage">
        <div className="notificationsHeader">
            <h2>Notifications</h2>
        </div>
        { 
            (batchedNotifications && batchedNotifications.length > 0) ? <ul>
                { batchedNotifications.map( (n) => {
                    return <li key={`notifications_${n.type}_${n.lastEvent}`}>{formatEvent(n,fetcher)}</li>
                })}
            </ul> : <div>Nothing has happened yet</div>
        }
    </div>
  
}  
