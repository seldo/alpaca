import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";
import * as clientdon from "~/models/posts.client";
import { Post, batchNotifications, reactionClick, reactionState, reactionData } from "~/shared/components/post"
import { LinkToAccount } from "~/shared/components/post"
import { useEffect, useState } from "react";

const NOTIFICATONS_FETCH_INTERVAL = 5
const MIN_ID = "notifications_most_recent_id" // FIXME: exists in two places

export const loader = async ({request}) => {
    let authUser = await authenticateAndRefresh(request)
    let doneUrl = new URL(request.url).pathname
    return {authUser, doneUrl}
}

const formatEvent = (event,fetcher,options) => {
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
                {Post(event.status,{isRepost: true, avatar:false,displayName: false,fetcher,handleLike:reactionClick})}
            </div>
        case "mention":
            return <div className="notificationMessage notifyMention">
                {Post(event.status,{isRepost: true,fetcher,handleLike:reactionClick, repliesOpen: options.repliesOpen, openReply: options.openReply, doneUrl: options.doneUrl})}
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
    const {authUser, doneUrl} = useLoaderData();

    // create a fetcher hook to get data in the background
    const fetcher = useFetcher();

    // set up a state newNotifications updated by setNotifications, initialized to notifications
    let [allNotifications,setAllNotifications] = useState([])
    let [notificationsBuffer,setNotificationsBuffer] = useState([])
    let [batchedNotifications,setBatchedNotifications] = useState([])

    // initialize notifications from client cache if possible
    useEffect(() => {
        (async () => {
            allNotifications = await clientdon.getNotifications(authUser)
            batchedNotifications = batchNotifications(allNotifications)
            setAllNotifications(allNotifications)
            setBatchedNotifications(batchedNotifications)
        })();            
    },[]) // but only one time

    // set up an interval timer that uses fetcher to get notifications data
    useEffect(() => {
        const interval = setInterval( () => {
            // only refresh if the page is being viewed
            if(document.visibilityState === "visible") {
                console.log("Tryna fetch")
                let feedUrl = "/api/v1/notifications"
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
            let incoming = fetcher.data
            console.log("Incoming notifications",incoming)
            let seenIds = []
            // we've seen everything in allnotifications
            for(let i = 0; i < allNotifications.length; i++) {
              seenIds.push(allNotifications[i].id)
            }
            // and we already have everything in the buffer
            for(let i = 0; i < notificationsBuffer.length; i++) {
                seenIds.push(notificationsBuffer[i].id)
            }
            // append anything genuinely new to the buffer
            for(let i = 0; i < incoming.length; i++) {
              let n = incoming[i]
              if (!seenIds.includes(n.id)) {
                notificationsBuffer.push(n)
              }
            }
            notificationsBuffer.sort( (a,b) => {
              if(b.created_at > a.created_at) return 1
              else return -1
            })
            // storing state across pages
            /*
            if(window && window.localStorage && newNotifications.length > 0) {
                window.localStorage[MIN_ID] = newNotifications[0].id   
            }
            */
            setNotificationsBuffer(notificationsBuffer)
        }
    },[fetcher.data])

    /*
    // when newNotifications is modified, update the state
    useEffect(() => {
        setNewNotifications(newNotifications)
        batchedNotifications = batchNotifications(newNotifications)
    },[newNotifications])

    useEffect(() => {
        reactionState()
    }, [fetcher.state])
    */

    // when they click the button to see new notifications, merge buffer into all and reset buffer
    const mergeNewNotifications = () => {
        allNotifications = allNotifications.concat(notificationsBuffer)
        console.log("New full notifications set",allNotifications)
        notificationsBuffer = []
        // update local cache for next refresh
        clientdon.updateNotifications(allNotifications)
        // trigger a refresh of batched notifications
        batchedNotifications = batchNotifications(allNotifications)
        setAllNotifications(allNotifications)
        setNotificationsBuffer(notificationsBuffer)
        setBatchedNotifications(batchedNotifications)
    }

    const [repliesOpen,setRepliesOpen] = useState(false)
    const openReply = (e,postId) => {
        e.preventDefault()
        e.stopPropagation()
        if(postId == repliesOpen) {
          setRepliesOpen(false)
        } else {
          setRepliesOpen(postId)
        }
    }
    
    return <div className="notificationsPage">
        <div className="pageHeader notificationsHeader">
            <h2>Notifications</h2>
        </div>
        <div className={`newNotifications ` + ((notificationsBuffer.length > 0) ? "active" : "")}>
            <button className="button newNotificationsButton" onClick={mergeNewNotifications}>New notifications ({notificationsBuffer.length})</button>
        </div>

        { 
            (batchedNotifications && batchedNotifications.length > 0) ? <ul>
                { batchedNotifications.map( (n) => {
                    return <li key={`notifications_${n.type}_${n.lastEvent}`}>{formatEvent(n,fetcher,{repliesOpen,openReply,doneUrl})}</li>
                })}
            </ul> : <div>Nothing has happened yet</div>
        }
    </div>
  
}  
