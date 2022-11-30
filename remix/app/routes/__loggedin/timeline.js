import authenticator from "~/services/auth.server";
import * as mastodon from "~/models/tweets.server";

export const loader = async ({request}) => {
    console.log("/timeline called")
    let authUser = await authenticator.isAuthenticated(request, {
        failureRedirect: "/auth/mastodon?fromhome",
        throwOnError: true
    })
    const url = new URL(request.url);
    let minId = url.searchParams.get("minId");    
    if(minId == "null") minId = null
    let tweets = await mastodon.fetchTimeline(authUser,minId)
    let tweetString = JSON.stringify(tweets)
    return new Response(tweetString, {    
        status: 200
    });
}
