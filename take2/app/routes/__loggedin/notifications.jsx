import { useState, useEffect } from "react"
import { useOutletContext } from "react-router-dom"
import { mergeWithoutDupes, getNotifications } from "~/shared/library/mastodon.client"
import { Post, LinkToAccount } from "~/shared/components/post"

const parseThingId = (n) => {
    switch (n.type) {
        case "mention": return "mentioned_" + n.status.id
        case "status": return // FIXME: ignoring notifications for now
        case "reblog": return "reblogged_" + n.status.id
        case "follow": return "followed_you"
        case "follow_request": return n.account.id + "_requested_follow"
        case "favourite": return "favorited_" + n.status.id
        case "poll": return // FIXME: ignoring polls ending for now
        case "update": return // FIXME: ignoring status updates for now
    }
}

const batchNotifications = (notifications) => {
    console.log("batching up",notifications)
    let thingsReactedTo = {}
    // batch up by the thing they are reacting to
    for (let i = 0; i < notifications.length; i++) {
        let n = notifications[i]
        let nId = parseThingId(n)
        if (!thingsReactedTo[nId]) thingsReactedTo[nId] = []
        thingsReactedTo[nId].push(n)
    }
    // process each group of reactions
    let batches = []
    for (let trt of Object.values(thingsReactedTo)) {
        console.log(trt)
        // everything is the same type so we can infer it from the first one
        let type = trt[0].type
        // get the events into most recent order
        trt.sort((a, b) => {
            if (b.created_at > a.created_at) return 1
            else return -1
        })
        let lastEvent = trt[0].created_at // credit the batch with the time of the most recent
        let notification = { type, lastEvent }
        switch (type) {
            case "favourite": // fuckin' "u"s
                // many people can favorite one status
                notification.status = trt[0].status
                notification.accounts = trt.map((t) => {
                    return t.account
                })
                break;
            case "mention":
                // only one person can mention you at a time
                notification.status = trt[0].status
                notification.account = trt[0].account
                break;
            case "follow":
                // many people can follow you
                notification.accounts = trt.map((t) => {
                    return t.account
                })
                break;
        }
        batches.push(notification)
    }
    // sort by lastEvent
    batches.sort((a, b) => {
        if (b.lastEvent > a.lastEvent) return 1
        else return -1
    })
    return batches
}

const formatEvent = (event,options) => {
    switch(event.type) {
        case "favourite":
            return <div className="notifyLike">
                {
                    (event.accounts.length == 1) ? <div className="notifyText">
                        <div><span className="displayName">{LinkToAccount(event.accounts[0])}</span> liked your post</div>
                    </div> : (event.accounts.length == 2) ? <div className="notifyText">
                        <div><span className="displayName">{LinkToAccount(event.accounts[0])}</span> and <span className="displayName">{LinkToAccount(event.accounts[1])}</span> liked your post</div>
                    </div> : <div className="notifyText">
                        <div><span className="displayName">{LinkToAccount(event.accounts[0])}</span> and {event.accounts.length-1} others liked your post</div>
                    </div>
                }
                <Post post={event.status} options={{isRepost: true, avatar: false, displayName: false}} />
            </div>
        case "mention":
            return <div className="notifyMention">
                <Post post={event.status} options={{isRepost: true}}/>
            </div>
        case "follow":
            return <div className="notifyFollow">
                {
                    (event.accounts.length == 1) ? <div className="notifyText">
                        <div><span className="displayName">{LinkToAccount(event.accounts[0])}</span> followed you</div>
                    </div> : (event.accounts.length == 2) ? <div className="notifyText">
                        <div><span className="displayName">{LinkToAccount(event.accounts[0])}</span> and <span className="displayName">{LinkToAccount(event.accounts[1])}</span> followed you</div>
                    </div> : <div className="notifyText">
                        <div><span className="displayName">{LinkToAccount(event.accounts[0])}</span> and {event.accounts.length-1} others followed you.</div>
                    </div>
                }
            </div>
    }
}

export default function Notifications() {

    const {authUser} = useOutletContext();
    const [allNotifications,setAllNotifications] = useState([])
    const [notificationsBuffer,setNotificationsBuffer] = useState([])
    const [batchedNotifications,setBatchedNotifications] = useState([])

    // when they click the button to see new notifications, merge buffer into all and reset buffer
    const mergeNewNotifications = () => {
/*        allNotifications = allNotifications.concat(notificationsBuffer)
        console.log("New full notifications set",allNotifications)
        notificationsBuffer = []
        // update local cache for next refresh
        clientdon.updateNotifications(allNotifications)
        // trigger a refresh of batched notifications
        batchedNotifications = batchNotifications(allNotifications)
        setAllNotifications(allNotifications)
        setNotificationsBuffer(notificationsBuffer)
        setBatchedNotifications(batchedNotifications)
*/
    }

    // when the layout finds the user, this is triggered
    useEffect(() => {
        (async () => {
            if(!authUser) return
            console.log("Getting notificatons for",authUser)
            // initialize with saved posts from localstorage
            //let savedPosts = await loadLocalTimeline(authUser)
            //let mergedPosts = await mergeWithoutDupes(allPosts, savedPosts)
            //setPosts(mergedPosts)
            // fetch any new notifications from server
            let latestNotifications = await getNotifications(authUser)
            let secondMerge = await mergeWithoutDupes([], latestNotifications)
            setAllNotifications(secondMerge)
            let secondBatch = batchNotifications(secondMerge)
            setBatchedNotifications(secondBatch)
            //saveLocalNotifications(authUser,secondMerge)
            // and start streaming
            //console.log("Passing setPostBuffer",setPostBuffer)
            //streamEvents(authUser, postBuffer, setPostBuffer, postBufferCount, setPostBufferCount)
        })();
    }, [authUser])

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
                    return <li key={`notifications_${n.type}_${n.lastEvent}`} className="notificationMessage">{formatEvent(n)}</li>
                })}
            </ul> : <div>Nothing has happened yet</div>
        }
    </div>
  
}  
