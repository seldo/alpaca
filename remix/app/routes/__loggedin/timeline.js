import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";

export const loader = async ({request}) => {
    console.log("/timeline called")
    let authUser = await authenticateAndRefresh(request)
    console.log("/timeline got authuser",authUser.username,"@",authUser.instance)
    const url = new URL(request.url);
    let minId = url.searchParams.get("minId");    
    if(minId == "null") minId = null // FIXME: why does this happen?
    let tweets = await mastodon.getTimelineRemote(authUser,minId)
    let tweetString = JSON.stringify(tweets)
    return new Response(tweetString, {    
        status: 200
    });
}
