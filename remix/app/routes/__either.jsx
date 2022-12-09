import {Outlet} from "@remix-run/react";
import { useLoaderData } from "@remix-run/react";
import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";
import Globalnav from "~/shared/components/globalnav"

export const loader = async ({request}) => {
    // we auth but don't bounce if they aren't, because these routes can be public
    let authUser = await authenticateAndRefresh(request,{
        throwOnError: false
    })
    let user = null
    if(authUser) {
        user = await mastodon.getOrCreateUserFromData(authUser)
    }
    return {user}
}

export default function Index() {
    let {user} = useLoaderData()    
    return <div className="loggedInOrOut">
        <Globalnav user={user} />
        <div className="content">
            <Outlet />
        </div>
    </div>
}
