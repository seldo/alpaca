import {Outlet} from "@remix-run/react";
import Globalnav from "~/shared/components/globalnav"

export const loader = async ({request}) => {
    // we don't auth here for "either" routes
    return null
}

export default function Index() {
    return <div>
        <div className="main-gutter h-screen fixed top-0">
        <Globalnav />
        </div>
        <div className="content">
            <Outlet />
        </div>
    </div>
}
