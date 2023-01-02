import Avatar from "~/shared/components/avatar"
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import { Link } from "react-router-dom";
import { ComposeBox } from "~/shared/components/compose"
import { likePost, translateExternalPostId } from "~/shared/library/mastodon.client"

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

export const getInstanceFromAccount = (account) => {
    let acctInstance = account.acct.split('@')[1]
    if (acctInstance) return acctInstance
    let urlInstance = account.url.split('//')[1].split('/')[0]
    return urlInstance
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

export const handleLike = async function (options) {
    console.log("they clicked like, so we like it and update state")
    let postId = await translateExternalPostId(options.authUser,options.post)
    let likedPost = await likePost(options.authUser,postId)
    console.log("Likedpost",likedPost)
    // update this post saying we liked it
    for(let i = 0; i < options.allPosts.length; i++) {
        if(options.allPosts[i].id == likedPost.id) {
            options.allPosts[i] = likedPost
            options.setPosts(options.allPosts)
            break;
        }
    }
    // optimistically animate the icon
    console.log("target",options.target)
    let icon = options.target.getElementsByClassName('reactionIcon')[0]
    icon.classList.add("active")
    icon.style.transition = "1.5s"
    icon.style.transform = "rotate(720deg)"
}

export const Post = ({post,options}) => {
    options = {
        avatar: true,
        displayName: true,
        isRepost: false,
        openReply: null,
        repliesOpen: null,
        doneUrl: false,
        authUser: null,
        allPosts: null,
        setPosts: null,
        ...options
    }    

    let fetcher = options.fetcher

    //console.log("post is",post)
    if (!post) return // FIXME: why on earth would we get null posts sometimes?
    if (!post.account.instance) post.account.instance = getInstanceFromAccount(post.account)
    if (post.reblog !== null) {
        return <div className="postOrRepost repost">
            <div className="repostNotice">
                <span className="repostDisplayName">{LinkToAccount(post.account)}</span> reblogged
            </div>
            {Post({
                post: post.reblog, 
                options: {
                    ...options,
                    isRepost: true
                }
            })}
        </div>
    } else {
        return <div className={(!options.isRepost ? `postOrRepost` : ``) + ` post`} >
            <div className="postBody" onClick={() => options.navigate(getPostLink(post))}>
                <div className="author">
                    {
                        (options.avatar) ? <div className="authorAvatar">
                            <Avatar user={post.account} />
                        </div> : <div />
                    }
                    {
                        (options.displayName) ? <div className="authorText">
                            <div className="displayName"><Link to={getProfileLink(post.account)}>{post.account.display_name}</Link></div>
                            <div className="userAndTime">
                                <div className="username">@{post.account.username}@{post.account.instance}</div>
                                <div className="time"><Link to={getPostLink(post)} title={post.application?`via `+post.application.name:""}>{timeAgo.format(Date.parse(post.created_at), 'twitter')}</Link></div>
                            </div>
                        </div> : <div/>
                    }
                </div>
                <div className="status" dangerouslySetInnerHTML={{ __html: post.content }} />
                { 
                    (post.media_attachments.length > 0) ? <div className="media">
                        {
                            post.media_attachments.map( (a) => {
                                if(!a || !a.preview_url) return
                                else return <div><img src={a.preview_url}/></div>
                            })
                        }
                    </div> : <div/>
                }
                <div className="reactions">
                    <div className="reaction replies" onClick={(e) => options.openReply(e,post.id)}>
                        <div className="reactionIcon"></div>
                        <span>{post.replies_count ? post.replies_count : ''}</span>
                    </div>                    
                    <div className="reaction reposts">
                        <fetcher.Form method="post" action="/post/repost" reloadDocument>
                            <input type="hidden" name="postUrl" value={post.url} />
                            <button className="postReaction" type="submit" onClick={options.handleLike}>
                                <div className="reactionIcon"></div>
                                <span>{post.reblogs_count ? post.reblogs_count : ''}</span>
                            </button>
                        </fetcher.Form>
                    </div>
                    <div className="reaction likes" onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleLike({
                                authUser: options.authUser,
                                post: post,
                                allPosts: options.allPosts,
                                setPosts: options.setPosts,
                                target: e.currentTarget
                            })
                        }}>
                        <div className={`reactionIcon ` + (post.favourited ? `active` : null) }></div>
                        <span>{post.favourites_count ? post.favourites_count : ''}</span>
                    </div>
                    <div className="reaction share">
                        <div className="reactionIcon"></div>
                        <span>Share</span>
                    </div>
                </div>
                {
                    (options.repliesOpen == post.id) ? <ComposeBox isComposing={true} replyHandle={post.account.username} inReplyTo={getPostUniversalId(post)} doneUrl={options.doneUrl} /> : <div/>
                }
            </div>
        </div>
    }
}
