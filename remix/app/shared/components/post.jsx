import Avatar from "~/shared/components/avatar"
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import { Link } from "react-router-dom";
import { useState } from "react"
import { ComposeBox } from "~/shared/components/compose"
//import { useNavigate } from "react-router-dom";
//import { Form } from "@remix-run/react";

// FIXME: this gets called lots of times, call it once.
TimeAgo.addLocale(en)
const timeAgo = new TimeAgo('en-US')

export const makePostId = (post) => {
    return `${post.account.username}:${post.account.instance}:${post.hash}`
}

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

export const getPostUniversalId = (post) => {
    const regex = /https:\/\/(.*)\/@(.*)\/(.*)/gm;
    let postSegments = false
    try {
        let [, userInstance, username, postId] = regex.exec(post.url)
        postSegments = {
            username,
            userInstance,
            postId
        }
    } catch (e) {
        console.log("Got a non-mastodon URL",post.url)
        return false
    }
    let uid = `${postSegments.username}@${postSegments.userInstance}/${postSegments.postId}`
    return uid
}

export const getPostLink = (post) => {
    let postUniversalId = getPostUniversalId(post)
    if (!postUniversalId) {
        // best effort
        console.log("Doing nonstandard URL")
        return `/p/nonstandard/` + post.url.replace("https://", "")
    }
    return `/p/` + postUniversalId
}

export const LinkToAccount = (account, content) => {
    let profileLink = getProfileLink(account)
    return <Link to={profileLink}>{(account.display_name || "@" + account.username)}</Link>
}

let fetcher // blows my mind that I can successfully hoist this up here
let whichOne = null

export const reactionClick = function (e) {
    //console.log("they clicked the button so we submit the fetcher")
    e.preventDefault()
    e.stopPropagation()
    fetcher.submit(e.currentTarget)
    whichOne = e.currentTarget
}

export const reactionState = function () {
    //console.log("Handler says state changed for this post; do animation here")
    if (whichOne) {
        let containerState = whichOne.parentNode.parentNode.classList
        if (containerState.contains("likes") || containerState.contains("reposts")) {
            let icon = whichOne.getElementsByClassName('reactionIcon')[0]
            icon.classList.add("active")
            icon.style.transition = "1.5s"
            icon.style.transform = "rotate(720deg)"
        }
    }
}

export const reactionData = function () {
    //console.log("Handler says data changed so it probably should do stuff with that")
}

const Post = (t,options) => {
    options = {
        avatar: true,
        displayName: true,
        isRepost: false,
        openReply: null,
        repliesOpen: null,
        doneUrl: false,
        ...options
    }    

    // can I do this?
    fetcher = options.fetcher

    //console.log(t)
    if (!t.account.instance) t.account.instance = getInstanceFromAccount(t.account)
    if (t.reblog !== null) {
        return <div className="postOrRepost repost">
            <div className="repostNotice">
                <span className="repostDisplayName">{LinkToAccount(t.account)}</span> reblogged
            </div>
            {Post(t.reblog, {
                ...options,
                isRepost: true
            })}
        </div>
    } else {
        //console.log(t)
        return <div className={(!options.isRepost ? `postOrRepost` : ``) + ` post`} >
            <div className="postBody" onClick={() => options.navigate(getPostLink(t))}>
                <div className="author">
                    {
                        (options.avatar) ? <div className="authorAvatar">
                            <Avatar user={t.account} />
                        </div> : <div />
                    }
                    {
                        (options.displayName) ? <div className="authorText">
                            <div className="displayName"><Link to={getProfileLink(t.account)}>{t.account.display_name}</Link></div>
                            <div className="userAndTime">
                                <div className="username">@{t.account.username}@{t.account.instance}</div>
                                <div className="time"><Link to={getPostLink(t)}>{timeAgo.format(Date.parse(t.created_at), 'twitter')}</Link></div>
                            </div>
                        </div> : <div/>
                    }
                </div>
                <div className="status" dangerouslySetInnerHTML={{ __html: t.content }} />
                { 
                    (t.media_attachments.length > 0) ? <div className="media">
                        {
                            t.media_attachments.map( (a) => {
                                if(!a || !a.preview_url) return
                                else return <div><img src={a.preview_url}/></div>
                            })
                        }
                    </div> : <div/>
                }
                <div className="reactions">
                    <div className="reaction replies" onClick={(e) => options.openReply(e,t.id)}>
                        <div className="reactionIcon"></div>
                        <span>{t.replies_count ? t.replies_count : ''}</span>
                    </div>                    
                    <div className="reaction reposts">
                        <fetcher.Form method="post" action="/post/repost" reloadDocument>
                            <input type="hidden" name="postUrl" value={t.url} />
                            <button className="postReaction" type="submit" onClick={options.handleLike}>
                                <div className="reactionIcon"></div>
                                <span>{t.reblogs_count ? t.reblogs_count : ''}</span>
                            </button>
                        </fetcher.Form>
                    </div>
                    <div className="reaction likes">
                        <fetcher.Form method="post" action="/post/like" reloadDocument>
                            <input type="hidden" name="postUrl" value={t.url} />
                            <button className="postReaction" type="submit" onClick={options.handleLike}>
                                <div className="reactionIcon"></div>
                                <span>{t.favourites_count ? t.favourites_count : ''}</span>
                            </button>
                        </fetcher.Form>
                    </div>
                    <div className="reaction share">
                        <div className="reactionIcon"></div>
                        <span>Share</span>
                    </div>
                </div>
                {
                    (options.repliesOpen == t.id) ? <ComposeBox isComposing={true} replyHandle={t.account.username} inReplyTo={getPostUniversalId(t)} doneUrl={options.doneUrl} /> : <div/>
                }
            </div>
        </div>
    }
}

export { Post }
export default Post
