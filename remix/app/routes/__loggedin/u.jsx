import {Outlet} from "@remix-run/react";

export default function Index() {
    return <div>
        This is a layout.
        <Outlet />
    </div>
}
