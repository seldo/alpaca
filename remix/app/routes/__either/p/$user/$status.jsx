import { useState, useEffect } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";
import { Post, makePostId, reactionClick, reactionState, reactionData } from "~/shared/components/post"
import { useNavigate } from "react-router-dom";


export const loader = async ({ request, params }) => {
    let authUser = await authenticateAndRefresh(request, {
        throwOnError: false
    })
    // TODO: if params.user starts with @ because of manual URL creation, take care of it
    const [username, userInstance] = params.user.split("@")
    const postId = params.status
    let thread = await mastodon.getThreadRemote({
        username,
        userInstance,
        postId
    }, authUser)
    // done URL is just where we are now
    let doneUrl = new URL(request.url).pathname
    return { authUser, username, userInstance, postId, thread, doneUrl }
}

export default function Index() {
    const fetcher = useFetcher();
    const { authUser, username, userInstance, postId, thread, doneUrl } = useLoaderData()
    const navigate = useNavigate();

    useEffect(() => {
        reactionState()
    }, [fetcher.state]);

    // When the fetcher comes back with new posts, update timeline
    useEffect(() => {
        if (fetcher.data) {
            reactionData()
        }
    }, [fetcher.data]);

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



    //console.log("thread", thread)
    return <div className="thread">
        <div className="threadTitle pageHeader">Post by {username}@{userInstance}</div>
        <div>
            <ul className="ancestors">
                {
                    (thread.ancestors.length > 0) ? thread.ancestors.map(t => {
                        return <li key={makePostId(t)}>{Post(t, { avatar: true, fetcher,handleLike: reactionClick, navigate, repliesOpen, openReply, doneUrl })}</li>
                    }) : <div/>
                }
            </ul>
            <ul className="currentGeneration">
                {
                    <li key={makePostId(thread.post)}>{Post(thread.post, { avatar: true, fetcher, handleLike: reactionClick, navigate, repliesOpen, openReply, doneUrl })}</li>
                }
            </ul>
            <ul className="descendants">
                {
                    (thread.descendants.length > 0) ? thread.descendants.map(t => {
                        return <li key={makePostId(t)}>{Post(t, { avatar: true, fetcher, handleLike: reactionClick, navigate, repliesOpen, openReply, doneUrl })}</li>
                    }) : <div/>
                }
            </ul>
        </div>
    </div>
}
