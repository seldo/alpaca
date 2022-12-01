import Avatar from "~/shared/components/avatar"

export default function Globalnav({user}) {
    return <div className="menu-bar flex flex-col place-content-between h-full">
        <div className="menu">
            <div className="logo py-2">
                <img className="floof" src="/images/floof-with-border.svg" />
            </div>
            <ul className="menuItems">
                <li><a className="home" href="/home"><span>Home</span></a></li>
                <li><a className="search" href="/search"><span>Search</span></a></li>
                <li><a className="notifications" href="/notifications"><span>Notifications</span></a></li>
                <li><a className="messages" href="/message"><span>Messages</span></a></li>
                <li><a className="profile" href="/profile"><span>Profile</span></a></li>
                <li><a className="settings" href="/settings"><span>Settings</span></a></li>
                <li><a className="compose" href="/compose"><span>Compose</span></a></li>
            </ul>
        </div>
        <Avatar user={user} />
    </div>
}
