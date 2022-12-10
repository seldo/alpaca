import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";

export const loader = async ({request}) => {
    console.log("/profile_feed called")
    let authUser = await authenticateAndRefresh(request)
    const url = new URL(request.url);
    let minId = url.searchParams.get("minId");    
    let username = url.searchParams.get("username");
    let instance = url.searchParams.get("instance");
    if(minId == "null") minId = null
    console.log("/profile_feed requesting only past min id",minId)
    let user = await mastodon.getUserRemote(username,instance,authUser)
    let posts = await mastodon.getPostsRemote(user,authUser,minId)
    console.log("/profile_feed got",posts.length)
    let postString = JSON.stringify(posts)
    return new Response(postString, {    
        status: 200
    });
}
