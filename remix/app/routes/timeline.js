import authenticator from "../services/auth.server";
import * as mastodon from "../models/tweets.server";

export const loader = async ({request}) => {
    console.log("/timeline called")
    let authUser = await authenticator.isAuthenticated(request, {
        failureRedirect: "/auth/mastodon?fromhome",
        throwOnError: true
    })
    console.log("/timeline authed successfully")
    let tweets = await mastodon.fetchTweets(authUser)
    let tweetString = JSON.stringify(tweets)
    return new Response(tweetString, {    
        status: 200
    });
}
