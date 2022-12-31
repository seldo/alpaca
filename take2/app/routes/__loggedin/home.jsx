import { useState, useEffect } from "react";
import { authenticate } from "~/shared/library/auth.client"
import { useNavigate } from "react-router-dom";
import { useFetcher } from "@remix-run/react";
import { ComposeBox } from "~/shared/components/compose"
import { Post } from "~/shared/components/post"
import { streamEvents, getTimeline, mergeWithoutDupes } from "~/shared/library/mastodon.client"

export default function Home() {

    const navigate = useNavigate()
    const fetcher = useFetcher()
    const [authUser,setAuthUser] = useState()
    const [isComposing,setIsComposing] = useState(false)
    const [allPosts, setPosts] = useState([])
    const [postBufferCount, setPostBufferCount] = useState(0)

    const mergePostBuffer = () => {

    }

    useEffect(() => {
        (async () => {
            let authUser = await authenticate(navigate, {
                failure: "/?needlogin"
            })
            setAuthUser(authUser)
            // initialize with saved posts from localstorage
            // ....
            // now fetch the latest 
            let latestPosts = await getTimeline(authUser)
            //setPosts(latestPosts)
            let mergedPosts = await mergeWithoutDupes(allPosts,latestPosts)
            //console.log("Merged posts",mergedPosts)
            setPosts(mergedPosts)
            // and start streaming
            streamEvents(authUser,allPosts)
        })();
    }, [])

    return (
        <div>
          <div className="composeTop">
            <ComposeBox user={authUser?.user} isComposing={isComposing} setIsComposing={setIsComposing}/>
          </div>
          <div className={`morePosts ` + ((postBufferCount > 0) ? "active" : "")}>
            <button className="button morePostsButton" onClick={mergePostBuffer}>Load more ({postBufferCount})</button>
          </div>
          <ul>
            {
              (allPosts.length > 0) ? allPosts.map( (post,index) => {
                let key = post.id
                //return <li key={key}>Yo.{post.content}</li>
                return <li key={key}>{Post(post, { navigate, fetcher })}</li>
              }) : <li key="noPosts">No posts yet. Give it a sec.</li>
            }
          </ul>
       </div>
      );
}
