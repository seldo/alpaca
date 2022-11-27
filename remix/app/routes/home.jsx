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

  const [refreshInterval,setRefresh] = useState(1)

  // Get fresh data after 1 second and then every 5 seconds thereafter
  useEffect(() => {
    const interval = setInterval(() => {
      console.log(`Refresh interval: ${refreshInterval}`)
      if(refreshInterval == 1) {
        setRefresh(5)
      }
      if (document.visibilityState === "visible") {
        fetcher.load("/timeline");
      }
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [fetcher.data]);

  // When the fetcher comes back with new data,
  // update our `data` state.
  useEffect(() => {
    if (fetcher.data) {
      let incoming = JSON.parse(fetcher.data)
      setData(incoming.concat(newTweets));
    }
  }, [fetcher.data]);

  return (
    <div>
      <div class="userdata">
        <p>User: {user.display_name || user.username }</p>
      </div>
      <h1>Home</h1>
      <ul>
        {
          (newTweets.length > 0) ? newTweets.map( t=> {
            //console.log("tweet:")
            //console.log(t)  
            return (
              <li class="tweet">
                <div class="author">
                  <span class="displayName">{t.account.display_name}</span>
                  <span class="username">@{t.account.acct}</span>
                </div>
                <div class="status" dangerouslySetInnerHTML={{__html: t.content}} />
                <div class="reactions">
                  <span>💬 {t.replies_count}</span>
                  <span>🔁 {t.reblogs_count}</span>
                  <span>⭐️ {t.favourites_count}</span>
                </div>
              </li>
            )            
          }) : null
        }
        {
          user.tweets? user.tweets.map(t => {
            return (
              <li class="tweet">
                <div class="author">
                  <span class="displayName">{t.account.display_name}</span>
                  <span class="username">@{t.account.acct}</span>
                </div>
                <div class="status" dangerouslySetInnerHTML={{__html: t.content}} />
                <div class="reactions">
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
