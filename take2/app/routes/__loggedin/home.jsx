import { useState, useEffect } from "react";
import { authenticate } from "~/shared/library/auth.client"
import { useNavigate } from "react-router-dom";
import { useFetcher } from "@remix-run/react";
import { ComposeBox } from "~/shared/components/compose"
import { Post } from "~/shared/components/post"
import { streamEvents, getTimeline, mergeWithoutDupes, saveLocalTimeline, loadLocalTimeline } from "~/shared/library/mastodon.client"
import { useOutletContext } from "react-router-dom";

export default function Home() {

    const navigate = useNavigate()
    const fetcher = useFetcher()
    //const [authUser, setAuthUser] = useState()
    const {authUser} = useOutletContext();
    const [isComposing, setIsComposing] = useState(false)
    const [allPosts, setPosts] = useState([])
    const [postBuffer, setPostBuffer] = useState([])
    const [postBufferCount, setPostBufferCount] = useState(0)

    const mergePostBuffer = async () => {
        let merged = await mergeWithoutDupes(allPosts,postBuffer)
        // merge in the posts
        setPosts(merged)
        setPostBuffer([])
        setPostBufferCount(0)
        // update the client cache
        saveLocalTimeline(authUser,merged)
    }

    const handleScroll = async () => {
        const windowHeight = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
        const body = document.body;
        const html = document.documentElement;
        const docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
        const windowBottom = windowHeight + window.pageYOffset;
        if (windowBottom >= docHeight) {
            console.log("Last post is ",allPosts)
            let morePosts = getTimeline(authUser,{
                maxId: allPosts[allPosts.length-1].id
            })
            let merged = await mergeWithoutDupes(allPosts,morePosts)
            setPosts(merged)
            saveLocalTimeline(authUser,merged)
        }
    }    

    useEffect(() => {
        (async () => {
            if(!authUser) return
            console.log("Getting posts for",authUser)
            // initialize with saved posts from localstorage
            let savedPosts = await loadLocalTimeline(authUser)
            let mergedPosts = await mergeWithoutDupes(allPosts, savedPosts)
            setPosts(mergedPosts)
            // fetch any newer posts from server
            let latestPosts = await getTimeline(authUser)
            let secondMerge = await mergeWithoutDupes(mergedPosts, latestPosts)
            setPosts(secondMerge)
            saveLocalTimeline(authUser,secondMerge)
            // and start streaming
            //console.log("Passing setPostBuffer",setPostBuffer)
            streamEvents(authUser, postBuffer, setPostBuffer, postBufferCount, setPostBufferCount)
            // infinite scrollllllll
            window.addEventListener("scroll", handleScroll);
        })();
    }, [authUser])

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
