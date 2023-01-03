import { useState, useEffect } from "react";
import { useLoaderData } from "@remix-run/react";
import { getThread } from "~/shared/library/mastodon.client"
import { Post } from "~/shared/components/post"
import { useNavigate } from "react-router-dom";
import { useFetcher } from "@remix-run/react";
import { useOutletContext } from "react-router-dom";

export const loader = async ({ request, params }) => {
    // TODO: if params.user starts with @ because of manual URL creation, take care of it
    const [username, userInstance] = params.user.split("@")
    const postId = params.status
    return {username,userInstance,postId}
}

export default function Index() {
    // this is just parsing the URL for us
    let {username,userInstance,postId} = useLoaderData()
    const {authUser} = useOutletContext()
    const [thread,setThread] = useState()
    const navigate = useNavigate()
    const fetcher = useFetcher()
    const [repliesOpen, setRepliesOpen] = useState(false)

    const openReply = (e,postId) => {
        if(repliesOpen === postId) {
            setRepliesOpen(false)
        } else {
            setRepliesOpen(postId)
        }
    }

    useEffect( () => {
        (async () => {
            let incomingThread = await getThread(username,userInstance,postId)
            if (incomingThread) {
                setThread(incomingThread)
            }
        })();
      },[username])    

    useEffect( () => {
    (async () => {
        if(authUser) {
            // hydrate some shiz
            console.log("$status got authuser",authUser)
        }
    })();
    },[authUser])    

    return <div className="thread">
        <div className="threadTitle pageHeader">Post by {username}@{userInstance}</div>
        {authUser?.access_token}
        <div>
            <ul className="ancestors">
                {
                    (thread?.ancestors.length > 0) ? thread.ancestors.map(p => {
                        return <li key={p.id}><Post post={p} options={{ avatar: true, fetcher, navigate, authUser, openReply, repliesOpen, setRepliesOpen, overridePostId: p.url }}/></li>
                    }) : <div/>
                }
            </ul>
            { thread ? <ul className="currentGeneration">
                {
                    <li key={thread.post.id}><Post post={thread.post} options={{ avatar: true, fetcher, navigate, authUser, openReply, repliesOpen, setRepliesOpen, overridePostId: thread.post.url }}/></li>
                }
            </ul> : <div>Loading...</div> }
            <ul className="descendants">
                {
                    (thread?.descendants.length > 0) ? thread.descendants.map(p => {
                        return <li key={p.id}><Post post={p} options={{ avatar: true, fetcher, navigate, authUser, openReply, repliesOpen, setRepliesOpen, overridePostId: p.url }}/></li>
                    }) : <div/>
                }
            </ul>
        </div>
    </div>
}
