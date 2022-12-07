import { useState, useEffect } from "react";
import { useLoaderData, useFetcher, useOutletContext } from "@remix-run/react";
import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";
import { Post, reactionClick, reactionState, reactionData } from "~/shared/components/post"
import { ComposeBox } from "~/shared/components/compose"

// time in seconds between refreshes
const INITIAL_LOAD_DELAY = 5
const ONGOING_LOAD_PERIOD = 10

export const loader = async ({request, data}) => {
  let authUser = await authenticateAndRefresh(request,{
    failureRedirect: "/",
    throwOnError: true
  })
  console.log(`/home got ${authUser.username}@${authUser.instance}`)
  let user = await mastodon.getOrCreateUserFromData(authUser)
  let localPosts = await mastodon.getTimelineLocal(user,{ hydrate: true })
  return { user, localPosts }
}

export default function Index() {
  const loaderData = useLoaderData();
  const {user, localPosts } = loaderData

  const [allPosts,setPosts] = useState(localPosts);
  useEffect(() => setPosts(allPosts), [allPosts]);
  const fetcher = useFetcher();

  const [refreshInterval,setRefresh] = useState(INITIAL_LOAD_DELAY)

  // Get fresh data after x seconds and then every y seconds thereafter
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Fetcher.data happened")
      if(refreshInterval == INITIAL_LOAD_DELAY) {
        setRefresh(ONGOING_LOAD_PERIOD)
      }
      if (document.visibilityState === "visible") {
        // FIXME: is index 0 really the max ID of the current set, so the min of the fetch?
        let minId = allPosts[0] ? allPosts[0].id : null
        fetcher.load("/timeline?minId="+minId);
      }
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
    // FIXME: because this depends on fetcher.data, initial load is true until we get our first data
  }, [fetcher.data]);

  let makePostId = (post) => {
    return `${post.account.username}:${post.account.instance}:${post.hash}`
  }

  // When the fetcher comes back with new data, update state
  useEffect(() => {
    if (fetcher.data) {
      let incoming = JSON.parse(fetcher.data)
      console.log(incoming)
      // dedupe and merge incoming posts since this is not guaranteed
      let seenIds = []
      for(let i = 0; i < allPosts.length; i++) {
        seenIds.push(makePostId(allPosts[i]))
      }
      for(let i = 0; i < incoming.length; i++) {
        let post = incoming[i]
        if (!seenIds.includes(makePostId(post))) {
          allPosts.push(post)
        }
      }
      allPosts.sort( (a,b) => {
        if(b.created_at > a.created_at) return 1
        else return -1
      })
      setPosts(allPosts)
  }
  }, [fetcher.data]);

  return (
    <div>
      <div className="latest">
        <h2>Latest posts</h2>
      </div>
      <div className="composeTop">
        <ComposeBox user={user} />
      </div>
      <ul>
        {
          (allPosts.length > 0) ? allPosts.map( t=> {
            return <li key={makePostId(t)}>{Post(t,{avatar:true,handleLike,fetcher})}</li>
          }) : <li key="noTweets">No posts yet. Give it a sec.</li>
        }
      </ul>
    </div>
  );
}
