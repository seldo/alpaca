import { useLoaderData, useParams } from "@remix-run/react";
import { authenticateAndRefresh } from "~/services/auth.server";

export const loader = async ({ request, params }) => {
    let authUser = await authenticateAndRefresh(request, {
        throwOnError: false
    })
    // TODO: if params.user starts with @ because of manual URL creation, take care of it
    const [user,userInstance] = params.user.split("@")
    const postId = params.status
    return {authUser,user,userInstance,postId}
}

export default function Index() {
    let {authUser,user,userInstance,postId} = useLoaderData()
    return <div>
        This is post {postId} for user {user}
    </div>
}
