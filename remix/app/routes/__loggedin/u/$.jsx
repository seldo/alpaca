import { useState, useEffect } from "react";
import { 
    useLoaderData, 
    useFetcher, 
    useNavigate
} from "@remix-run/react";
import { Link } from "react-router-dom";
import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";
import { Post, reactionClick, reactionState, reactionData } from "~/shared/components/post"
import Avatar from "~/shared/components/avatar"
import FollowButton from "~/shared/components/followbutton"

// time in seconds between refreshes
const INITIAL_LOAD_DELAY = 3
const ONGOING_LOAD_PERIOD = 5
const MIN_ID = "posts_most_recent_id"

export const loader = async ({request, params}) => {
    let authUser = await authenticateAndRefresh(request)
    let handle = params['*']
    let [username,theirInstanceName] = handle.split('@')
    let user = await mastodon.getOrCreateUser(username,theirInstanceName,authUser,{
        withPosts: true
    })
    let following = await mastodon.isFollowing(username,theirInstanceName,authUser)
    let profileUrl = new URL(request.url)
    let optimisticFollow = null
    if(profileUrl.searchParams.has('followed')) {
        optimisticFollow = true
    }
    if(profileUrl.searchParams.has('unfollowed')) {
        optimisticFollow = false
    }
    return { user, following, optimisticFollow }
}

export const meta = ({data}) => {
    return {
        title: `${data.user.display_name || data.user.username} | Alpaca Blue: a Mastodon client`,
    }
}

export default function Index() {
    const {user, following, optimisticFollow} = useLoaderData();
    const navigate = useNavigate();
    // set up a fetch to get new post data
    const fetcher = useFetcher();

    // set up state for posts
    const [posts,setPosts] = useState(user.posts)
    const [refreshInterval,setRefresh] = useState(INITIAL_LOAD_DELAY)

    // Get fresh data after x seconds and then every y seconds thereafter
    useEffect(() => {
        reactionData()
        const interval = setInterval(() => {
            console.log("/u/$.jsx: Fetcher.data happened")
            if(refreshInterval == INITIAL_LOAD_DELAY) {
                setRefresh(ONGOING_LOAD_PERIOD)
            }
            // only refresh if the page is being viewed
            if(document.visibilityState === "visible") {
                let feedUrl = `/profile_feed?username=${user.username}&instance=${user.instance}`
                if(window && window.localStorage) {
                    if(window.localStorage[MIN_ID]) {
                        feedUrl += "&minId=" + window.localStorage[MIN_ID]
                    }
                }
                fetcher.load(feedUrl)
            }
        }, refreshInterval * 1000);
        return () => clearInterval(interval);
    }, [fetcher.data]);

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
            for(let i = 0; i < posts.length; i++) {
              seenIds.push(posts[i].id)
            }
            for(let i = 0; i < incoming.length; i++) {
              let p = incoming[i]
              if (!seenIds.includes(p.id)) {
                posts.push(p)
              }
            }
            posts.sort( (a,b) => {
                console.log(a)
              if(b.created_at > a.created_at) return 1
              else return -1
            })
            // storing state across pages
            if(window && window.localStorage && posts.length > 0) {
                window.localStorage[MIN_ID] = posts[0].id   
            }
            setPosts(posts)
        }
    },[fetcher.data])

    useEffect(() => {
        reactionState()
    }, [fetcher.state])

    //console.log("u/$.jsx user",user)
    return <div className="profilePage">
        <div className="profileTopNav flex flex-row">
            <Link to="/" onClick={() => navigate(-1)}><div className="backButton"></div></Link>
            <div>
                <div className="displayName">{user.display_name || user.username}</div>
                <div className="postCount">{user.statuses_count} posts</div>
            </div>
        </div>
        <div className="profileHeader">
            <div className="headerContainer">
                <img src={user.header} />
            </div>
            <div className="avatarContainer">
                <Avatar user={user} />
            </div>
        </div>
        <div className="buttonBar">
            <FollowButton username={user.username} instance={user.instance} following={(optimisticFollow !== null) ? optimisticFollow : following.following} />            
        </div>
        <div className="descriptions">
            <div className="displayName">
                { user.display_name || user.username }
            </div>
            <div className="note" dangerouslySetInnerHTML={{__html: user.note}} />
            <div className="followerCounts">
                <span className="followingCount"><span className="number">{ user.following_count }</span> Following</span> 
                <span className="followersCount"><span className="number">{ user.followers_count }</span> Followers</span> 
            </div>
        </div>
        <div>
        <ul>
        {
          (posts && posts.length > 0) ? posts.map( t=> {
            return <li key={t.id}>{Post(t,{avatar: true, fetcher, handleLike: reactionClick})}</li>
          }) : <li key="noPosts">No posts yet. Give it a sec.</li>
        }
        </ul>
        </div>
    </div>
}
