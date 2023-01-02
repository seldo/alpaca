import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFetcher } from "@remix-run/react";
import { ComposeBox } from "~/shared/components/compose"
import { Post } from "~/shared/components/post"
import { streamEvents, getTimeline, mergeWithoutDupes, saveLocalTimeline, loadLocalTimeline } from "~/shared/library/mastodon.client"
import { useOutletContext } from "react-router-dom";
import VisibilitySensor from "react-visibility-sensor";

export default function Home() {

    const navigate = useNavigate()
    const fetcher = useFetcher()
    const {authUser} = useOutletContext();
    const [isComposing, setIsComposing] = useState(false)
    const [repliesOpen, setRepliesOpen] = useState(false)
    const [allPosts, setPosts] = useState([])
    let [postBuffer, setPostBuffer] = useState([])
    let [postBufferCount, setPostBufferCount] = useState(0)

    const mergePostBuffer = async () => {
        let merged = await mergeWithoutDupes(allPosts,postBuffer)
        // merge in the posts
        setPosts(merged)
        setPostBuffer([])
        setPostBufferCount(0)
        // update the client cache
        saveLocalTimeline(authUser,merged)
    }

    const infiniteScroll = async () => {
        if (allPosts.length > 0) {
            console.log("Last post is ",allPosts[allPosts.length-1])
            let morePosts = await getTimeline(authUser,{
                maxId: allPosts[allPosts.length-1].id
            })
            let merged = await mergeWithoutDupes(allPosts,morePosts)
            setPosts(merged)
            saveLocalTimeline(authUser,merged)
        }
    }    

    const openReply = (e,postId) => {
        if(repliesOpen === postId) {
            setRepliesOpen(false)
        } else {
            setRepliesOpen(postId)
        }
    }

    // when the layout finds the user, this is triggered
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
        })();
    }, [authUser])

    return (
        <div>
            <div className="composeTop">
                <ComposeBox user={authUser} isComposing={isComposing} setIsComposing={setIsComposing}/>
            </div>
            <div className={`morePosts ` + ((postBufferCount > 0) ? "active" : "")}>
                <button className="button morePostsButton" onClick={mergePostBuffer}>Show new posts</button>
            </div>
            {
                (allPosts.length > 0) ? <ul>{
                    allPosts.map((post, index) => {
                        let key = post.id
                        return <li key={index}>
                            <Post 
                                post={post}
                                options={ {navigate, fetcher, authUser, allPosts, setPosts, repliesOpen, setRepliesOpen, openReply} } />
                            </li>
                    })}</ul> : <div>No posts yet. Give it a sec.</div>
            }
            <VisibilitySensor onChange={infiniteScroll}>
                <div>Loading more posts...</div>
            </VisibilitySensor>
        </div>
    );
}
