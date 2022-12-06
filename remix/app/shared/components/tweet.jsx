import Avatar from "~/shared/components/avatar"
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import { Link } from "react-router-dom";

// FIXME: this gets called lots of times, call it once.
TimeAgo.addLocale(en)
const timeAgo = new TimeAgo('en-US')

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

export const batchNotifications = (notifications) => {
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

export const getInstanceFromAccount = (account) => {
    let acctInstance = account.acct.split('@')[1]
    if (acctInstance) return acctInstance
    let urlInstance = account.url.split('//')[1].split('/')[0]
    return urlInstance
}

export const LinkToAccount = (account, content) => {
    account.instance = getInstanceFromAccount(account)
    let profileLink = `/u/${account.username}@${account.instance}`
    return <Link to={profileLink}>{(account.display_name || "@" + account.username)}</Link>
}

const Tweet = (t, options = {
    avatar: true
}) => {
    //console.log(t)
    if (t.reblog !== null) {
        return <div className="reblog">
            <div className="reblogNotice">
                {LinkToAccount(t.account)} reblogged
            </div>
            {Tweet(t.reblog)}
        </div>
    } else {
        //console.log(t)
        return <div className="post flex flex-row w-full">
            <div className="gutter">
                {
                    (options.avatar) ? <div className="authorAvatar">
                        <Avatar user={t.account} />
                    </div> : <div />
                }
            </div>
            <div className="postBody nextToAvatar grow">
                <div className="author">
                    <span className="displayName">{t.account.display_name}</span>
                    <span className="username">@{t.account.acct}</span>
                    <span className="time">{timeAgo.format(Date.parse(t.created_at), 'twitter')}</span>
                </div>
                <div className="status" dangerouslySetInnerHTML={{ __html: t.content }} />
                <div className="reactions flex flex-row place-content-between w-full">
                    <div className="replies">{t.replies_count ? t.replies_count : ''}</div>
                    <div className="reblogs">{t.reblogs_count ? t.reblogs_count : ''}</div>
                    <div className="favorites">{t.favourites_count ? t.favourites_count : ''}</div>
                    <div className="share"><span>Share</span></div>
                </div>
            </div>
        </div>
    }
}

export { Tweet }
export default Tweet
