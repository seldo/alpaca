import { useLoaderData } from "@remix-run/react";
import { authenticateAndRefresh } from "~/services/auth.server";
import * as mastodon from "~/models/posts.server";
import { useEffect, useState } from "react";
import { ComposeBox } from "~/shared/components/compose"

export const loader = async ({request}) => {
    let authUser = await authenticateAndRefresh(request)
    return {authUser}
}

export default function Index() {
    const {user} = useLoaderData();

    return <div className="composePage">
        <div className="composeHeader pageHeader">
            <h2>Make a post</h2>
        </div>
        <ComposeBox isComposing={true} />
    </div>
  
}  
