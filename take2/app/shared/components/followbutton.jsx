import { Form } from "@remix-run/react";

// FIXME: don't use form for this

export default function FollowButton({username,instance,following}) {
    if (following) {
        return <Form method="post" action={`/u/unfollow`} reloadDocument>
            <input type="hidden" name="username" value={username} />
            <input type="hidden" name="instance" value={instance} />
            <button className="genericButton followButton empty">Following</button>
        </Form>
    } else {
        return <Form method="post" action={`/u/follow`} reloadDocument>
            <input type="hidden" name="username" value={username} />
            <input type="hidden" name="instance" value={instance} />
            <button className="genericButton followButton filled">Follow</button>
        </Form>
    }
}
