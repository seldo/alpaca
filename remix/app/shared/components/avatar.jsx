import { Link } from "@remix-run/react";

export default function Avatar({user}) {
    if (user) {
        return <div className="avatar">
            <Link rel="intent" to={`/u/${user.username}@${user.instance}`}><img className="avatarImage" src={user.avatar} title={user.display_name || user.username } /></Link>
        </div>
    } else {
        return <div />
    }
}
