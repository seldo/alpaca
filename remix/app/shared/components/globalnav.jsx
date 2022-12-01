import Avatar from "~/shared/components/avatar"

export default function Globalnav({user}) {
    return <div className="menu-bar flex flex-col place-content-between h-full">
        <div className="menu">
            <div className="logo py-2">
                <img className="floof" src="/images/floof-with-border.svg" />
            </div>
            <ul className="menuItems">
                <li><a key="menu1" className="home" href="/home"><span>Home</span></a></li>
                <li><a key="menu2" className="search" href="/search"><span>Search</span></a></li>
                <li><a key="menu3" className="notifications" href="/notifications"><span>Notifications</span></a></li>
                <li><a key="menu4" className="messages" href="/message"><span>Messages</span></a></li>
                <li><a key="menu5" className="profile" href="/profile"><span>Profile</span></a></li>
                <li><a key="menu6" className="settings" href="/settings"><span>Settings</span></a></li>
                <li><a key="menu7" className="compose" href="/compose"><span>Compose</span></a></li>
            </ul>
        </div>
        <Avatar user={user} />
    </div>
}
