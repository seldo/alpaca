import {Outlet} from "@remix-run/react";
import { useLoaderData } from "@remix-run/react";
import authenticator from "~/services/auth.server";
import * as mastodon from "~/models/tweets.server";
import Globalnav from "~/shared/components/globalnav"

export const loader = async ({request}) => {
    let authUser = await authenticator.isAuthenticated(request, {
        failureRedirect: "/auth/mastodon?fromhome"
    })
    let user = await mastodon.getOrCreateUserFromData(authUser)
    return { user }
}

export default function Index() {
    const loaderData = useLoaderData();
    const {user} = loaderData  
    return <div>
        <div className="main-gutter h-screen fixed top-0">
        <Globalnav user={user} />
        </div>
        <div className="content">
        <Outlet context={{user}}/>
        </div>
    </div>
}
