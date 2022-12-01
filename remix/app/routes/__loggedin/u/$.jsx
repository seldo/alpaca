import { useState, useEffect } from "react";
import { MetaFunction } from "@remix-run/node"
import { useLoaderData, useFetcher } from "@remix-run/react";
import authenticator from "../../../services/auth.server";
import * as mastodon from "../../../models/tweets.server";
import stylesRoot from "~/../styles/root.css";
import { Tweet } from "../../../shared/components/tweet"

export const loader = async ({request, params}) => {
    let authUser = await authenticator.isAuthenticated(request, {
        throwOnError: true
    })
    let handle = params['*']
    let [username,instance] = handle.split('@')
    let user = await mastodon.getOrFetchUserByUsername(username,instance,{
        withTweets: true,
        token: authUser.accessToken
    })
    let following = await mastodon.isFollowing(authUser.accessToken,user.id)
    return { user, following }
}

export const meta = ({data}) => {
    return {
        title: `${data.user.display_name || data.user.username} | Alpaca Blue: a Mastodon client`,
    }
}

export default function Index() {
    const {user, following} = useLoaderData();
    return <div>
        <div>
            <div className="backButton">Back</div>
            <div>{user.display_name}</div>
            <div>@{user.acct}</div>
        </div>
        # of Tweets
        <div>
            background
        </div>
        <div>
            Avatar ---- 
            <div>
                { 
                (following.following) ? <span>Following</span> : <button>
                    Follow
                </button>
                }
            </div>
        </div>
        <div>
            Display name again
        </div>
        <div>
            Profile description
        </div>
        <div>
            Profile metadata
        </div>
        <div>
            Follow and follower counts
        </div>
        <div>
        <ul>
        {
          (user.tweets.length > 0) ? user.tweets.map( t=> {
            return Tweet(t)      
          }) : <li key="noTweets">No tweets yet. Give it a sec.</li>
        }
        </ul>
        </div>
    </div>
}
