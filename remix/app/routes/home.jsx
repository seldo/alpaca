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
  const [tweets,setData] = useState([]);

  useEffect(() => setData(tweets), [tweets]);
  const fetcher = useFetcher();
  
  // Get fresh data every 30 seconds.
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Calling at interval")
      if (document.visibilityState === "visible") {
        fetcher.load("/timeline");
      }
    }, 7 * 1000);

    return () => clearInterval(interval);
  }, []);
  
  // When the fetcher comes back with new data,
  // update our `data` state.
  useEffect(() => {
    if (fetcher.data) {
      console.log("The data is")
      console.log(fetcher.data)
      setData(JSON.parse(fetcher.data));
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
          (tweets.length > 0) ? tweets.map( t=> {
            console.log("tweet:")
            console.log(t)  
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
