import Avatar from "~/shared/components/avatar"
import { Link } from "react-router-dom";
import { useMatches } from "@remix-run/react";
import { useNavigate } from "react-router-dom";

export default function Globalnav({user}) {
    const matches = useMatches();
    const navigate = useNavigate();
    let pathname = matches[matches.length-1].pathname
    console.log("pathname",pathname)
    let isHome = false
    if (pathname == "/home") isHome = true;

    return <div className="globalNav">
        {
            (isHome) ? <div className="logo">
                <img className="floof" src="/images/ab-logomark.svg" />
                <img className="logoType" src="/images/ab-logotype.svg" />
            </div> : <div className="backLink">
                <Link to="/" onClick={() => navigate(-1)}>
                    <div className="arrow"><span>Back</span></div>
                </Link>
            </div>
        }
        <div className="profileMenu">
            <Avatar user={user} />
        </div>
        <div className="menuBar">
            <ul className="menuItems">
                <li className="home" key="menu1"><Link prefetch="render" to="/home"><span>Home</span></Link></li>
                <li className="messages" key="menu24"><a href="/message"><span>Messages</span></a></li>
                <li className="compose" key="menu3"><a href="/compose"><span>Compose</span></a></li>
                <li className="search" key="menu4"><Link prefetch="render" to="/search"><span>Search</span></Link></li>
                <li className="notifications" key="menu5"><Link prefetch="render" to="/notifications"><span>Notifications</span></Link></li>
            </ul>
        </div>
    </div>
}
