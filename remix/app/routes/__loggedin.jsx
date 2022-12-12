import { useState, useEffect } from "react";
import { Outlet } from "@remix-run/react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";
import Globalnav from "~/shared/components/globalnav"
import { useMatches, Link } from "@remix-run/react";
import { useNavigate } from "react-router-dom";

const INITIAL_LOAD_DELAY = 5
const ONGOING_LOAD_PERIOD = 15
const MIN_ID = "notifications_most_recent_id"

export const loader = async ({request}) => {
  let authUser = await authenticateAndRefresh(request)
  let doneUrl = new URL(request.url).pathname
  return {authUser, doneUrl}
}

export default function Index() {
    const {authUser,doneUrl} = useLoaderData();
    const fetcher = useFetcher();
    const [refreshInterval, setRefresh] = useState(INITIAL_LOAD_DELAY)
    const [profileMenuOpen, setProfileMenuOpen] = useState(false)

    const matches = useMatches();
    let pathname = matches[matches.length-1].pathname
    let isHome = false
    if (pathname == "/home") isHome = true;
    const navigate = useNavigate();

    // Get fresh data after x seconds and then every y seconds thereafter
    useEffect(() => {
        const interval = setInterval(() => {
        if (window && window.localStorage) {
            let notificationCountUrl = "/api/v1/notifications/count"
            console.log("min ID",window.localStorage.getItem(MIN_ID))
            if (window.localStorage[MIN_ID]) {
              notificationCountUrl += "?minId=" + window.localStorage[MIN_ID]
            }
            fetcher.load(notificationCountUrl)
        }
        if (refreshInterval == INITIAL_LOAD_DELAY) {
            setRefresh(ONGOING_LOAD_PERIOD)
        }
        }, refreshInterval * 1000);
        return () => clearInterval(interval);
    }, [fetcher.data]);

    const [notificationsCount, setNotificationsCount] = useState(false);
    // When the fetcher comes back with notifications count, update that
    useEffect(() => {
      if (fetcher.data) {
        setNotificationsCount(fetcher.data['unreadCount'])
      }
    }, [fetcher.data]);
    
    useEffect(() => {
      if(window && window.document) {
        window.document.title = (notificationsCount ? `(${notificationsCount}) ` : ``) + `Alpaca Blue: a Mastodon client`
      }
    }, [notificationsCount])

    return <div className="loggedIn">
        <Globalnav user={authUser} navigate={navigate} isHome={isHome} profileMenuOpen={profileMenuOpen} setProfileMenuOpen={setProfileMenuOpen} />
        {(notificationsCount) ? <div className="notificationsBadge"><Link to="/notifications">{notificationsCount}</Link></div> : <div />}
        <div className="content">
            <Outlet context={{authUser}}/>
        </div>
    </div>
}
