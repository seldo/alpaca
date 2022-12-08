import { useLoaderData, useParams } from "@remix-run/react";
import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";
import { Post } from "~/shared/components/post"

export const loader = async ({ request, params }) => {
    let authUser = await authenticateAndRefresh(request, {
        throwOnError: false
    })
    // TODO: if params.user starts with @ because of manual URL creation, take care of it
    const [username,userInstance] = params.user.split("@")
    const postId = params.status
    let thread = mastodon.getThreadRemote({
        username,
        userInstance,
        postId
    },authUser)
    return {authUser,username,userInstance,postId,thread}
}

export default function Index() {
    let {authUser,username,userInstance,postId,thread} = useLoaderData()
    return <div>
        <div>This is post {postId} for user {username} as a thread</div>

    </div>
}
