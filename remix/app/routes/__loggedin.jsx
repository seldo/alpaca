import { useState, useEffect } from "react";
import { Outlet } from "@remix-run/react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";
import Globalnav from "~/shared/components/globalnav"
import { useMatches, Link } from "@remix-run/react";
import { useNavigate } from "react-router-dom";

const INITIAL_LOAD_DELAY = 30
const ONGOING_LOAD_PERIOD = 60
const MIN_ID = "notifications_most_recent_id"

export const loader = async ({request}) => {
    let authUser = await authenticateAndRefresh(request,{
        failureRedirect: "/?fromloggedin",
        throwOnError: true
    })
    let user = await mastodon.getOrCreateUserFromData(authUser)
    return { user, request }
}

export default function Index() {
    const loaderData = useLoaderData();
    const {user} = loaderData  
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
            if (window.localStorage[MIN_ID]) {
                fetcher.load("/notifications_count?minId=" + window.localStorage[MIN_ID])
            }
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
        setNotificationsCount(JSON.parse(fetcher.data)['unreadCount'])
      }
    }, [fetcher.data]);
    
    useEffect(() => {
      if(window && window.document) {
        window.document.title = (notificationsCount ? `(${notificationsCount}) ` : ``) + `Alpaca Blue: a Mastodon client`
      }
    }, [notificationsCount])

    return <div className="loggedIn">
        <Globalnav user={user} navigate={navigate} isHome={isHome} profileMenuOpen={profileMenuOpen} setProfileMenuOpen={setProfileMenuOpen} />
        {(notificationsCount) ? <div className="notificationsBadge"><Link to="/notifications">{notificationsCount}</Link></div> : <div />}
        <div className="content">
            <Outlet context={{user}}/>
        </div>
    </div>
}
