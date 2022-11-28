import { useState, useEffect } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import authenticator from "../services/auth.server";
import * as mastodon from "../models/tweets.server";

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

  const [newTweets,setData] = useState([]);
  useEffect(() => setData(newTweets), [newTweets]);
  const fetcher = useFetcher();

  const [refreshInterval,setRefresh] = useState(5)

  // Get fresh data after 5 seconds and then every 20 seconds thereafter
  useEffect(() => {
    const interval = setInterval(() => {
      console.log(`Refresh interval: ${refreshInterval}`)
      if(refreshInterval == 5) {
        setRefresh(20)
      }
      if (document.visibilityState === "visible") {
        fetcher.load("/timeline");
      }
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
    // FIXME: making this dependent on fetcher.data means it checks every 1 second until it gets some data, which is a thundering herd waiting to happen
  }, [fetcher.data]);

  // When the fetcher comes back with new data,
  // update our `data` state.
  useEffect(() => {
    console.log("Looking for fetcher data")
    if (fetcher.data) {
      console.log("Got fetcher data")
      let incoming = JSON.parse(fetcher.data)
      setData(incoming.concat(newTweets));
    }
  }, [fetcher.data]);

  return (
    <div>
      <div className="userdata">
        <p>User: {user.display_name || user.username }</p>
      </div>
      <h1>Home</h1>
      <ul>
        {
          (newTweets.length > 0) ? newTweets.map( t=> {
            //console.log("tweet:")
            //console.log(t)  
            return (
              <li className="tweet">
                <div className="author">
                  <span className="displayName">{t.account.display_name}</span>
                  <span className="username">@{t.account.acct}</span>
                </div>
                <div className="status" dangerouslySetInnerHTML={{__html: t.content}} />
                <div className="reactions">
                  <span>💬 {t.replies_count}</span>
                  <span>🔁 {t.reblogs_count}</span>
                  <span>⭐️ {t.favourites_count}</span>
                </div>
              </li>
            )            
          }) : <li>No tweets yet. Give it a sec.</li>
        }
        {
          user.tweets? user.tweets.map(t => {
            return (
              <li className="tweet">
                <div className="author">
                  <span className="displayName">{t.account.display_name}</span>
                  <span className="username">@{t.account.acct}</span>
                </div>
                <div className="status" dangerouslySetInnerHTML={{__html: t.content}} />
                <div className="reactions">
                  <span>💬 {t.replies_count}</span>
                  <span>🔁 {t.reblogs_count}</span>
                  <span>⭐️ {t.favourites_count}</span>
                </div>
              </li>
            )
          }) : <li>No tweets yet. Give it a sec.</li>
        }
      </ul>
    </div>
  );
}
