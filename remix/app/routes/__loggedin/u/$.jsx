import { useState, useEffect } from "react";
import { 
    useLoaderData, 
    useFetcher, 
    useNavigate
} from "@remix-run/react";
import { Link } from "react-router-dom";
import { authenticator, authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";
import { Post } from "~/shared/components/post"
import Avatar from "~/shared/components/avatar"
import FollowButton from "~/shared/components/followbutton"

export const action = async ({request,params}) => {
    let authUser = await authenticateAndRefresh(request)
    let handle = params['*']
    let [username,theirInstanceName] = handle.split('@')
    let profileUrl = new URL(request.url)
    let optimisticFollow = null
    if(profileUrl.searchParams.get('followed')) {
        optimisticFollow = true
    }
    if(profileUrl.searchParams.get('unfollowed')) {
        optimisticFollow = false
    }
    let user = await mastodon.getOrFetchUserByUsername(username,theirInstanceName,authUser.instance)
    let follow = await mastodon.followUserById(username,authUser.accessToken)
    follow.following = optimisticFollow || follow.following
    return null
}

export const loader = async ({request, params}) => {
    let authUser = await authenticateAndRefresh(request)
    let handle = params['*']
    let [username,theirInstanceName] = handle.split('@')
    let user = await mastodon.getOrFetchUserByUsername(username,theirInstanceName,authUser.instance,{
        withTweets: true,
        token: authUser.accessToken
    })
    let following = await mastodon.isFollowing(authUser,user.id,theirInstanceName)
    return { user, following }
}

export const meta = ({data}) => {
    return {
        title: `${data.user.display_name || data.user.username} | Alpaca Blue: a Mastodon client`,
    }
}

export default function Index() {
    const {user, following} = useLoaderData();
    const navigate = useNavigate();
    return <div className="profilePage">
        <div className="profileTopNav flex flex-row">
            <Link to="/" onClick={() => navigate(-1)}><div className="backButton"></div></Link>
            <div>
                <div className="displayName">{user.display_name || user.username}</div>
                <div className="tweetCount">{user.json.statuses_count} tweets</div>
            </div>
        </div>
        <div className="profileHeader">
            <div className="headerContainer">
                <img src={user.header} />
            </div>
            <div className="avatarContainer">
                <Avatar user={user.json} />
            </div>
        </div>
        <div className="buttonBar">
            <FollowButton username={user.username} instance={user.instance} following={following.following} />            
        </div>
        <div className="descriptions">
            <div className="displayName">
                { user.display_name || user.username }
            </div>
            <div className="note" dangerouslySetInnerHTML={{__html: user.json.note}} />
            <div className="followerCounts">
                <span className="followingCount"><span className="number">{ user.json.following_count }</span> Following</span> 
                <span className="followersCount"><span className="number">{ user.json.followers_count }</span> Followers</span> 
            </div>
        </div>
        <div>
        <ul>
        {
          (user.tweets.length > 0) ? user.tweets.map( t=> {
            return <li key={t.id}>{Tweet(t)}</li>
          }) : <li key="noTweets">No tweets yet. Give it a sec.</li>
        }
        </ul>
        </div>
    </div>
}
