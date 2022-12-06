import { useState, useEffect } from "react";
import { 
    useLoaderData, 
    useFetcher, 
    useNavigate
} from "@remix-run/react";
import { Link } from "react-router-dom";
import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";
import { Post } from "~/shared/components/post"
import Avatar from "~/shared/components/avatar"
import FollowButton from "~/shared/components/followbutton"

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
    //console.log("u/$.jsx user",user)
    return <div className="profilePage">
        <div className="profileTopNav flex flex-row">
            <Link to="/" onClick={() => navigate(-1)}><div className="backButton"></div></Link>
            <div>
                <div className="displayName">{user.display_name || user.username}</div>
                <div className="tweetCount">{user.statuses_count} tweets</div>
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
          (user.posts && user.posts.length > 0) ? user.posts.map( t=> {
            return <li key={t.id}>{Post(t)}</li>
          }) : <li key="noTweets">No posts yet. Give it a sec.</li>
        }
        </ul>
        </div>
    </div>
}
