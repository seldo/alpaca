import {Outlet} from "@remix-run/react";
import { authenticateAndRefresh } from "~/services/auth.server";
import Globalnav from "~/shared/components/globalnav"

export const loader = async ({request}) => {
    console.log("__loggedout called")
    let authUser = await authenticateAndRefresh(request,{
        successRedirect: "/home",
        throwOnError: false
    })
    // if we're logged in we'll redirect them
    // so they'll only get here if there's no user anyway
    return null
}

export default function Index() {
    return <div className="loggedOut">
        <Globalnav isHome={true}/>
        <div className="content">
            <Outlet />
        </div>
    </div>
}
