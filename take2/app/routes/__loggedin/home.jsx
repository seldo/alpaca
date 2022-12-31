import { useState, useEffect } from "react";
import { authenticate } from "~/shared/library/auth.client"
import { useNavigate } from "react-router-dom";
import { useFetcher } from "@remix-run/react";
import { ComposeBox } from "~/shared/components/compose"
import { Post } from "~/shared/components/post"
import { streamEvents, getTimeline, mergeWithoutDupes } from "~/shared/library/mastodon.client"
import { useOutletContext } from "react-router-dom";

export default function Home() {

    const navigate = useNavigate()
    const fetcher = useFetcher()
    //const [authUser, setAuthUser] = useState()
    const {authUser} = useOutletContext();
    const [isComposing, setIsComposing] = useState(false)
    const [allPosts, setPosts] = useState([])
    const [postBufferCount, setPostBufferCount] = useState(0)
    const mergePostBuffer = () => {

    }

    useEffect(() => {
        (async () => {
            if(!authUser) return
            // initialize with saved posts from localstorage
            // ....
            // now fetch the latest 
            console.log("Getting posts for",authUser)
            let latestPosts = await getTimeline(authUser)
            //setPosts(latestPosts)
            let mergedPosts = await mergeWithoutDupes(allPosts, latestPosts, setPosts)
            //console.log("Merged posts",mergedPosts)
            //setPosts(mergedPosts)
            // and start streaming
            streamEvents(authUser, allPosts)
        })();
    }, [authUser])

    console.log("allposts",allPosts)
    return (
        <div>
            <div className="composeTop">
                <ComposeBox user={authUser?.user} isComposing={isComposing} setIsComposing={setIsComposing} />
            </div>
            <div className={`morePosts ` + ((postBufferCount > 0) ? "active" : "")}>
                <button className="button morePostsButton" onClick={mergePostBuffer}>Load more ({postBufferCount})</button>
            </div>
            {
                (allPosts.length > 0) ? <ul>{
                    allPosts.map((post, index) => {
                        let key = post.id
                        console.log("Post is ", post)
                        return <li key={index}>
                            <Post 
                                post={post}
                                options={ {navigate, fetcher} } />
                            </li>
                    })}</ul> : <div>No posts yet. Give it a sec.</div>
            }
        </div>
    );
}
