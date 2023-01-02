import Avatar from "~/shared/components/avatar"
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import { Link } from "react-router-dom";
import { ComposeBox } from "~/shared/components/compose"
import { likePost, rePost, translateExternalPostId } from "~/shared/library/mastodon.client"

// FIXME: this gets called lots of times, call it once.
TimeAgo.addLocale(en)
const timeAgo = new TimeAgo('en-US')

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

export const handleRepost = async function (options) {
    // optimistically animate the icon
    let icon = options.target.getElementsByClassName('reactionIcon')[0]
    icon.classList.add("active")
    icon.style.transition = "1.5s"
    icon.style.transform = "rotate(720deg)"
    let postId = await translateExternalPostId(options.authUser,options.post)
    let rePosted = await rePost(options.authUser,postId)
    console.log("Repost",rePosted)
}

export const handleLike = async function (options) {
    // optimistically animate the icon
    let icon = options.target.getElementsByClassName('reactionIcon')[0]
    icon.classList.add("active")
    icon.style.transition = "1.5s"
    icon.style.transform = "rotate(720deg)"
    let postId = await translateExternalPostId(options.authUser,options.post)
    let likedPost = await likePost(options.authUser,postId)
    console.log("Likedpost",likedPost)
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
        hideReactions: false,
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
                { !options.hideReactions ? <div className="reactions">
                    <div className="reaction replies" onClick={(e) => options.openReply(e,post.id)}>
                        <div className="reactionIcon"></div>
                        <span>{post.replies_count ? post.replies_count : ''}</span>
                    </div>                    
                    <div className="reaction reposts" onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleRepost({
                                authUser: options.authUser,
                                post: post,
                                target: e.currentTarget
                            })
                        }}>
                        <div className={`reactionIcon ` + (post.reblogged ? `active` : null)}></div>
                        <span>{post.reblogs_count ? post.reblogs_count : ''}</span>
                    </div>
                    <div className="reaction likes" onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleLike({
                                authUser: options.authUser,
                                post: post,
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
                </div> : <></> }
                {
                    (options.repliesOpen == post.id) ? <ComposeBox isComposing={true} replyHandle={post.account.username} inReplyTo={getPostUniversalId(post)} doneUrl={options.doneUrl} /> : <div/>
                }
            </div>
        </div>
    }
}
