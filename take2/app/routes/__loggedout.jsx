import {Outlet} from "@remix-run/react";
//import Globalnav from "~/shared/components/globalnav"
//         <Globalnav isHome={true}/>

export default function Index() {
    return <div className="loggedOut">
        <div className="content">
            <Outlet />
        </div>
    </div>
}
