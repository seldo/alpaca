export default function Avatar({user}) {
    if (user) {
        return <div className="user">
            <img className="avatar" src={user.avatar} title={user.display_name || user.username } />
        </div>
    } else {
        return <div />
    }
}
