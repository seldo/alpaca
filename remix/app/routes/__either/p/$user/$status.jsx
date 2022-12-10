import { useState, useEffect } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";
import { Post, makePostId, reactionClick, reactionState, reactionData } from "~/shared/components/post"


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
    return { authUser, username, userInstance, postId, thread }
}

export default function Index() {
    const fetcher = useFetcher();
    const { authUser, username, userInstance, postId, thread } = useLoaderData()

    useEffect(() => {
        reactionState()
    }, [fetcher.state]);

    // When the fetcher comes back with new posts, update timeline
    useEffect(() => {
        if (fetcher.data) {
            reactionData()
        }
    }, [fetcher.data]);

    console.log("thread", thread)
    return <div>
        <div class="threadTitle">Post by {username}@{userInstance}</div>
        <div>
            <ul className="ancestors">
                {
                    (thread.ancestors.length > 0) ? thread.ancestors.map(t => {
                        return <li key={makePostId(t)}>{Post(t, { avatar: true, fetcher,handleLike: reactionClick })}</li>
                    }) : <div/>
                }
            </ul>
            <ul className="currentGeneration">
                {
                    <li key={makePostId(thread.post)}>{Post(thread.post, { avatar: true, fetcher, handleLike: reactionClick })}</li>
                }
            </ul>
            <ul className="descendants">
                {
                    (thread.descendants.length > 0) ? thread.descendants.map(t => {
                        return <li key={makePostId(t)}>{Post(t, { avatar: true, fetcher, handleLike: reactionClick })}</li>
                    }) : <div/>
                }
            </ul>
        </div>
    </div>
}
