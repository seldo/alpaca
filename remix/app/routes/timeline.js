import authenticator from "../services/auth.server";
import * as mastodon from "../models/tweets.server";

export const loader = async ({request}) => {
    console.log("Authenticating /timeline")
    let authUser = await authenticator.isAuthenticated(request, {
        failureRedirect: "/auth/mastodon?fromhome"
    })
    let tweets = await mastodon.fetchTweets(authUser)
    console.log("/timeline called")
    console.log(tweets)
    return new Response(JSON.stringify(tweets), {    
        status: 200
    });
}
