import Avatar from "~/shared/components/avatar"
import { Link } from "react-router-dom";

export default function Globalnav({user}) {
    return <div className="globalNav menu-bar flex flex-col place-content-between h-full">
        <div className="menu">
            <div className="logo py-2">
                <img className="floof" src="/images/floof-with-border.svg" />
            </div>
            <ul className="menuItems">
                <li key="menu1"><Link className="home" rel="render" to="/home"><span>Home</span></Link></li>
                <li key="menu2"><Link className="search" rel="render" to="/search"><span>Search</span></Link></li>
                <li key="menu3"><Link className="notifications" rel="render" to="/notifications"><span>Notifications</span></Link></li>
                <li key="menu4"><a className="messages" href="/message"><span>Messages</span></a></li>
                <li><Link className="profile" rel="intent" to="/profile"><span>Profile</span></Link></li>
                <li key="menu5"><a key="menu6" className="settings" href="/settings"><span>Settings</span></a></li>
                <li key="menu7"><a className="compose" href="/compose"><span>Compose</span></a></li>
                <li key="menu8"><a href="/auth/login">Login</a></li>
                <li key="menu9"><a href="/auth/logout">Logout</a></li>
            </ul>
        </div>
        <div className="authUser">
            <Avatar user={user} />
        </div>
    </div>
}
