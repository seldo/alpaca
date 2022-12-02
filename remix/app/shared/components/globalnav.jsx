import Avatar from "~/shared/components/avatar"
import { Link } from "react-router-dom";

export default function Globalnav({user}) {
    return <div className="menu-bar flex flex-col place-content-between h-full">
        <div className="menu">
            <div className="logo py-2">
                <img className="floof" src="/images/floof-with-border.svg" />
            </div>
            <ul className="menuItems">
                <li key="menu1"><Link className="home" to="/home"><span>Home</span></Link></li>
                <li key="menu2"><Link className="search" to="/search"><span>Search</span></Link></li>
                <li key="menu3"><Link className="notifications" to="/notifications"><span>Notifications</span></Link></li>
                <li key="menu4"><a className="messages" href="/message"><span>Messages</span></a></li>
                <li><a className="profile" href="/profile"><span>Profile</span></a></li>
                <li key="menu5"><a key="menu6" className="settings" href="/settings"><span>Settings</span></a></li>
                <li key="menu7"><a className="compose" href="/compose"><span>Compose</span></a></li>
            </ul>
        </div>
        <div class="authUser">
            <Avatar user={user} />
        </div>
    </div>
}
