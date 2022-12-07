import Avatar from "~/shared/components/avatar"
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import { Link } from "react-router-dom";
import { Form, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react"
import heartIcon from "~/shared/icons/heart-icon"
import HeartIcon from "~/shared/icons/heart-icon";

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

export const createPostHash = async (post) => {
    //const encoder = new TextEncoder();
    let hashMessage = post.account.username + ":" +
        post.account.instance + ":" +
        ((post.reblog && post.reblog.content) ? post.reblog.content : '') + ":" +
        post.content    
    // //console.log("Hash message",hashMessage)
    // const data = encoder.encode(hashMessage);
    // const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    // const hashArray = Array.from(new Uint8Array(hashBuffer));
    // const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashMessage // FIXME: the above wasn't working in Chrome
}

export const getProfileLink = (account) => {
    return `/u/${account.username}@${account.instance}`
}

export const LinkToAccount = (account, content) => {
    let profileLink = getProfileLink(account)
    return <Link to={profileLink}>{(account.display_name || "@" + account.username)}</Link>
}

export const cb = function() {
    console.log("cb called")
}

const Post = (t, options = {
    avatar: true
}) => {

    let fetcher = options.fetcher

    // handle likes
    const handleLike = async (e) => {
        console.log("Handling like")
        e.preventDefault()
        fetcher.submit(e.currentTarget)
        //setTarget(e.currentTarget)
    }

    /*
    const [target,setTarget] = useState();
    const fetcher2 = useFetcher();

    // when fetcher.data is modified this will trigger, including when the form returns
    useEffect(() => {
        if(fetcher2.data) {
            // like completed, but I guess we can be optimistic
        }
    }, [fetcher2.data]);

    // when fetcher.state is modified this will trigger, including during loading
    useEffect(() => {
        if(fetcher2.state == "submitting") {
            console.log("I can do something about",target)
            target.style.transition = "2s"
            target.style.transform = "rotate(720deg)"
            let svg = target.getElementsByTagName("svg")[0]
            svg.style.fill = "red"
        }
    }, [fetcher2.state]);
    */


    // TODO: the "done" value needs to come from request
    //console.log(t)
    if (t.reblog !== null) {
        return <div className="reblog">
            <div className="reblogNotice">
                {LinkToAccount(t.account)} reblogged
            </div>
            {Post(t.reblog,options)}
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
                    <span className="displayName"><Link to={getProfileLink(t.account)}>{t.account.display_name}</Link></span>
                    <span className="username">@{t.account.username}@{t.account.instance}</span>
                    <span className="time">{timeAgo.format(Date.parse(t.created_at), 'twitter')}</span>
                </div>
                <div className="status" dangerouslySetInnerHTML={{ __html: t.content }} />
                <div className="reactions flex flex-row place-content-between w-full">
                    <div className="reactionButton replies">{t.replies_count ? t.replies_count : ''}</div>
                    <div className="reactionButton reblogs">{t.reblogs_count ? t.reblogs_count : ''}</div>
                    <fetcher.Form method="post" action="/post/like" reloadDocument>
                        <input type="hidden" name="postUrl" value={t.url} />
                        <input type="hidden" name="done" value={getProfileLink(t.account)} />
                        <button className="postReaction" type="submit" onClick={options.handleLike}>
                            <div className="likes">
                            <HeartIcon>woo</HeartIcon>{t.favourites_count ? t.favourites_count : ''}
                            </div>
                        </button>
                    </fetcher.Form>
                    <div className="share"><span>Share</span></div>
                </div>
            </div>
        </div>
    }
}

export { Post }
export default Post
