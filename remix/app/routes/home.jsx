import { useState, useEffect } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import authenticator from "../services/auth.server";
import * as mastodon from "../models/tweets.server";
import stylesRoot from "../styles/root.css";

export const links = () => {
  return [
    { rel: "stylesheet", href: stylesRoot }
  ];
}

export const loader = async ({request}) => {
    let authUser = await authenticator.isAuthenticated(request, {
        failureRedirect: "/auth/mastodon?fromhome"
    })
    let user = await mastodon.getOrCreateUser(authUser)
    let timeline = await mastodon.getTimeline(authUser,{ hydrate: true })
    return { user, timeline }
}

const Tweet = (t) => {
  if(t.reblog !== null) {
      return <div className="reblog">
          <div className="reblogNotice">{t.account.display_name || "@" + t.account.username} reblogged</div>
          {Tweet(t.reblog)}
      </div>
  } else {
      return <li className="tweet flex flex-row w-full" key={t.id}>
          <div className="gutter">
          <div className="authorAvatar">
              <img src={t.account.avatar} />
          </div>
          </div>
          <div className="tweetBody grow">
          <div className="author">
              <span className="displayName">{t.account.display_name}</span>
              <span className="username">@{t.account.acct}</span>
          </div>
          <div className="status" dangerouslySetInnerHTML={{__html: t.content}} />
          <div className="reactions flex flex-row place-content-between w-full">
              <div className="replies">{t.replies_count ? t.replies_count : ''}</div>
              <div className="reblogs">{t.reblogs_count ? t.reblogs_count : ''}</div>
              <div className="favorites">{t.favourites_count ? t.favourites_count : ''}</div>
              <div className="share"><span>Share</span></div>
          </div>
          </div>
      </li>
  }
}

export default function Index() {
  const loaderData = useLoaderData();
  const {user, timeline } = loaderData

  const [newTweets,setTweets] = useState(timeline);
  useEffect(() => setTweets(newTweets), [newTweets]);
  const fetcher = useFetcher();

  const [refreshInterval,setRefresh] = useState(5)

  // Get fresh data after 5 seconds and then every 20 seconds thereafter
  useEffect(() => {
    const interval = setInterval(() => {
      if(refreshInterval == 5) {
        setRefresh(10)
      }
      if (document.visibilityState === "visible") {
        let minId = newTweets[0] ? newTweets[0].id : null
        fetcher.load("/timeline?minId="+minId);
      }
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
    // FIXME: making this dependent on fetcher.data means it checks every 1 second until it gets some data, which is a thundering herd waiting to happen
  }, [fetcher.data]);

  // When the fetcher comes back with new data,
  // update our `data` state.
  useEffect(() => {
    if (fetcher.data) {
      let incoming = JSON.parse(fetcher.data)
      setTweets(incoming.concat(newTweets));
  }
  }, [fetcher.data]);

  return (
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
        <div className="latest">
          <h1>Latest posts</h1>
        </div>
        <div className="composeTop pr-4">
          <textarea className="w-full" placeholder="What's up?"></textarea>
          <div className="buttonHolder">
            <button>Post</button>
          </div>
        </div>
        <ul>
          {
            (newTweets.length > 0) ? newTweets.map( t=> {
              return Tweet(t)      
            }) : <li key="noTweets">No tweets yet. Give it a sec.</li>
          }
        </ul>
      </div>
    </div>
  );
}
