import {Outlet} from "@remix-run/react";
import { useLoaderData } from "@remix-run/react";
import authenticator from "~/services/auth.server";
import * as mastodon from "~/models/tweets.server";
import Globalnav from "~/shared/components/globalnav"

export const loader = async ({request}) => {
    let authUser = await authenticator.isAuthenticated(request, {
        successRedirect: "/home?fromloggedout"
    })
    // if we're logged in we'll redirect them
    // so they'll only get here if there's no user anyway
    return null
}

export default function Index() {
    return <div>
        <div className="main-gutter px-3 py-2 h-screen fixed top-0">
        <Globalnav />
        </div>
        <div className="content">
        <Outlet />
        </div>
    </div>
}
