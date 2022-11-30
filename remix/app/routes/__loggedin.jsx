import {Outlet} from "@remix-run/react";
import { useLoaderData } from "@remix-run/react";
import authenticator from "~/services/auth.server";
import * as mastodon from "~/models/tweets.server";

export const loader = async ({request}) => {
    let authUser = await authenticator.isAuthenticated(request, {
        failureRedirect: "/auth/mastodon?fromhome"
    })
    let user = await mastodon.getOrCreateUser(authUser)
    return { user }
}

export default function Index() {
    const loaderData = useLoaderData();
    const {user} = loaderData  
    return <div>
        <div className="flex flex-row">
          <div className="gutter px-4 py-2 h-screen">
            <div className="menu-bar flex flex-col place-content-between h-full">
              <div className="menu">
                <div className="logo py-2">
                  <img className="floof" src="/images/floof-with-border.svg" />
                </div>
                <ul className="menuItems">
                  <li><a className="home" href="/home"><span>Home</span></a></li>
                  <li><a className="search" href="/search"><span>Search</span></a></li>
                  <li><a className="notifications" href="/notifications"><span>Notifications</span></a></li>
                  <li><a className="messages" href="/message"><span>Messages</span></a></li>
                  <li><a className="profile" href="/profile"><span>Profile</span></a></li>
                  <li><a className="settings" href="/settings"><span>Settings</span></a></li>
                  <li><a className="compose" href="/compose"><span>Compose</span></a></li>
                </ul>
              </div>
              <div className="user">
                <img className="avatar" src={user.avatar} title={user.display_name || user.username } />
              </div>
            </div>
          </div>
          <div className="content w-full">
            <Outlet context={{user}}/>
          </div>
        </div>
    </div>
}
