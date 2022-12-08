import { useState, useEffect } from "react";
import { Outlet } from "@remix-run/react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";
import Globalnav from "~/shared/components/globalnav"

const INITIAL_LOAD_DELAY = 1
const ONGOING_LOAD_PERIOD = 10
const MIN_ID = "notifications_most_recent_id"

export const loader = async ({request}) => {
    let authUser = await authenticateAndRefresh(request,{
        failureRedirect: "/",
        throwOnError: true
    })
    let user = await mastodon.getOrCreateUserFromData(authUser)
    return { user }
}

export default function Index() {
    const loaderData = useLoaderData();
    const {user} = loaderData  
    const fetcher = useFetcher();
    const [refreshInterval, setRefresh] = useState(INITIAL_LOAD_DELAY)

    // Get fresh data after x seconds and then every y seconds thereafter
    useEffect(() => {
        console.log("Fetcher effect above the navar")
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
        console.log("Fetcher saw data", fetcher.data)
        setNotificationsCount(JSON.parse(fetcher.data)['unreadCount'])
      }
    }, [fetcher.data]);
    
    useEffect(() => {
      console.log("new count", notificationsCount)
      if(window && window.document) {
        window.document.title = (notificationsCount ? `(${notificationsCount}) ` : ``) + `Alpaca Blue: a Mastodon client`
      }
    }, [notificationsCount])

    return <div>
        <div className="main-gutter h-screen fixed top-0">
            <Globalnav user={user} />
        </div>
        {(notificationsCount) ? <div className="notificationsBadge">{notificationsCount}</div> : <div />}
        <div className="content">
            <Outlet context={{user}}/>
        </div>
    </div>
}
