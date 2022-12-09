import { useState, useEffect } from "react";
import { useLoaderData, useFetcher, useOutletContext } from "@remix-run/react";
import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";
import { Post, makePostId, reactionClick, reactionState, reactionData } from "~/shared/components/post"
import { ComposeBox } from "~/shared/components/compose"

// time in seconds between refreshes
const INITIAL_LOAD_DELAY = 30
const ONGOING_LOAD_PERIOD = 60
const MIN_ID = "notifications_most_recent_id"

export const loader = async ({ request, data }) => {
  let authUser = await authenticateAndRefresh(request, {
    failureRedirect: "/?fromhome",
    throwOnError: true
  })
  console.log(`/home got ${authUser.username}@${authUser.instance}`)
  let user = await mastodon.getOrCreateUserFromData(authUser)
  let localPosts = await mastodon.getTimelineLocal(user, { hydrate: true })
  return { user, localPosts }
}

export default function Index() {
  const loaderData = useLoaderData();
  const { user, localPosts } = loaderData

  const [allPosts, setPosts] = useState(localPosts);
  useEffect(() => setPosts(allPosts), [allPosts]);
  const fetcher = useFetcher();

  const [refreshInterval, setRefresh] = useState(INITIAL_LOAD_DELAY)

  // Get fresh data after x seconds and then every y seconds thereafter
  useEffect(() => {
    const interval = setInterval(() => {
      if (refreshInterval == INITIAL_LOAD_DELAY) {
        setRefresh(ONGOING_LOAD_PERIOD)
      }
      if (document.visibilityState === "visible") {
        // FIXME: is index 0 really the max ID of the current set, so the min of the fetch?
        let minId = allPosts[0] ? allPosts[0].id : null
        fetcher.load("/timeline?minId=" + minId);
      }
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
    // FIXME: because this depends on fetcher.data, initial load is true until we get our first data
  }, [fetcher.data]);

  // Get fresh data after x seconds and then every y seconds thereafter
  useEffect(() => {
    reactionState()
  }, [fetcher.state]);

  // When the fetcher comes back with new posts, update timeline
  useEffect(() => {
    if (fetcher.data) {
      reactionData()
      let incoming
      try {
        incoming = JSON.parse(fetcher.data)
      } catch (e) {
        // FIXME: there must be a better way of identifying our response than this
        return
      }
      // dedupe and merge incoming posts since this is not guaranteed
      let seenIds = []
      for (let i = 0; i < allPosts.length; i++) {
        seenIds.push(makePostId(allPosts[i]))
      }
      for (let i = 0; i < incoming.length; i++) {
        let post = incoming[i]
        if (!seenIds.includes(makePostId(post))) {
          allPosts.push(post)
        }
      }
      allPosts.sort((a, b) => {
        if (b.created_at > a.created_at) return 1
        else return -1
      })
      setPosts(allPosts)
    }
  }, [fetcher.data]);

  return (
    <div>
      <div className="composeTop">
        <ComposeBox user={user} />
      </div>
      <ul>
        {
          (allPosts.length > 0) ? allPosts.map(t => {
            return <li key={makePostId(t)}>{Post(t, { avatar: true, fetcher, handleLike: reactionClick })}</li>
          }) : <li key="noPosts">No posts yet. Give it a sec.</li>
        }
      </ul>
    </div>
  );
}
