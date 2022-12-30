import { Outlet } from "@remix-run/react";
import Globalnav from "~/shared/components/globalnav"

export default function Index() {
    return <div className="loggedOut">
        <Globalnav isHome={true} />
        <div className="content">
            <Outlet />
        </div>
    </div>
}
