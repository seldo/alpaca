import { useState, useEffect } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";
import { Post, makePostId, reactionClick, reactionState, reactionData } from "~/shared/components/post"
import { ComposeBox } from "~/shared/components/compose"
import { useNavigate } from "react-router-dom";

// time in seconds between refreshes
const INITIAL_LOAD_DELAY = 5
const ONGOING_LOAD_PERIOD = 10

export const loader = async ({ request }) => {
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
  const { user, localPosts } = useLoaderData();
  const navigate = useNavigate();
  // fetch data for a variety of tasks
  const fetcher = useFetcher();

  // manage state for timeline
  let [allPosts, setPosts] = useState(localPosts);
  let [postBuffer, setPostBuffer] = useState([]);
  let [postBufferCount, setPostBufferCount] = useState(0)

  // manage state of how often we trigger data fetch
  const [refreshInterval, setRefresh] = useState(INITIAL_LOAD_DELAY)

  // manage state for the compose box
  const [isComposing,setIsComposing] = useState(false)

  // we could use this to animate when somebody has clicked something
  useEffect(() => {
    //console.log("Some kind of navigation is happening")
  },navigate.state)

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

  // sometimes the fetcher is getting data for likes or reblogs; pass to handler
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
      let previousCount = postBufferCount
      let seenIds = []
      for (let i = 0; i < allPosts.length; i++) {
        seenIds.push(makePostId(allPosts[i]))
      }
      // grab the current set of posts
      postBuffer = JSON.parse(JSON.stringify(allPosts))
      postBufferCount = postBufferCount + incoming.length

      // merge in any we haven't seen
      for (let i = 0; i < incoming.length; i++) {
        let post = incoming[i]
        if (!seenIds.includes(makePostId(post))) {
          postBuffer.push(post)
        }
      }
      // sort by date
      postBuffer.sort((a, b) => {
        if (b.created_at > a.created_at) return 1
        else return -1
      })
      // commit the state change
      setPostBuffer(postBuffer)
      setPostBufferCount(postBufferCount)
    }
  }, [fetcher.data]);
  
  // when they click load more, merge the timeline and reset
  const mergePostBuffer = () => {
    allPosts = postBuffer
    postBufferCount = 0
    console.log("load more should be inactive")
    let morePostsNotification = document.getElementsByClassName("morePosts")[0]
    morePostsNotification.classList.remove("active")
    setPostBuffer(postBuffer)
    setPostBufferCount(postBufferCount)
    setPosts(allPosts)
  }

  const [repliesOpen,setRepliesOpen] = useState(false)
  const openReply = (e,postId) => {
      e.preventDefault()
      e.stopPropagation()
      if(postId == repliesOpen) {
        setRepliesOpen(false)
      } else {
        setRepliesOpen(postId)
      }
  }

  return (
    <div>
      <div className="composeTop">
        <ComposeBox user={user} isComposing={isComposing} setIsComposing={setIsComposing}/>
      </div>
      <div className={`morePosts ` + ((postBufferCount > 0) ? "active" : "")}>
        <button className="button morePostsButton" onClick={mergePostBuffer}>Load more ({postBufferCount})</button>
      </div>
      <ul>
        {
          (allPosts.length > 0) ? allPosts.map(t => {
            return <li key={makePostId(t)}>{Post(t, { navigate, fetcher, handleLike: reactionClick, openReply, repliesOpen })}</li>
          }) : <li key="noPosts">No posts yet. Give it a sec.</li>
        }
      </ul>
    </div>
  );
}
