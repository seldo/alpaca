import { useState, useEffect } from "react";
import { useLoaderData, useFetcher, useOutletContext } from "@remix-run/react";
import authenticator from "~/services/auth.server";
import * as mastodon from "~/models/tweets.server";
import stylesRoot from "~/../styles/root.css";
import { Tweet } from "~/shared/components/tweet"
import Avatar from "~/shared/components/avatar"

export const links = () => {
  return [
    { rel: "stylesheet", href: stylesRoot }
  ];
}

export const loader = async ({request, data}) => {
  // FIXME: it is gross, GROSS that I have to re-load the user here
  // see https://github.com/remix-run/react-router/issues/9188#issuecomment-1248180434
  let authUser = await authenticator.isAuthenticated(request,{throwOnError:true})
  let user = await mastodon.getOrCreateUserFromData(authUser)
  let timeline = await mastodon.getTimeline(user,{ hydrate: true })
  return { user, timeline }
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
      // dedupe and merge incoming tweets since this is not guaranteed
      //let union = incoming.concat(newTweets)
      let seenIds = []
      for(let i = 0; i < newTweets.length; i++) {
        seenIds.push(newTweets[i].id)
      }
      for(let i = 0; i < incoming.length; i++) {
        let tweet = incoming[i]
        if (!seenIds.includes(tweet.id)) {
          newTweets.push(tweet)
        }
      }
      newTweets.sort( (a,b) => {
        console.log(a.created_at)
        if(b.created_at > a.created_at) return 1
        else return -1
      })
      setTweets(newTweets)
  }
  }, [fetcher.data]);

  return (
    <div>
      <div className="latest">
        <h1>Latest posts</h1>
      </div>
      <div className="composeTop pr-4 flex flex-row">
        <Avatar user={user} />
        <textarea className="w-full" placeholder="What's up?"></textarea>
      </div>
      <div className="buttonHolder">
        <button>Post</button>
      </div>
      <ul>
        {
          (newTweets.length > 0) ? newTweets.map( t=> {
            return Tweet(t)      
          }) : <li key="noTweets">No tweets yet. Give it a sec.</li>
        }
      </ul>
    </div>
  );
}
