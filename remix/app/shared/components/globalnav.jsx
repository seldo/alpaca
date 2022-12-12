import Avatar from "~/shared/components/avatar"
import { Link } from "react-router-dom";
import { Form } from "@remix-run/react";

export default function Globalnav({user,isHome,navigate,profileMenuOpen,setProfileMenuOpen}) {

    const toggleMenu = (e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log("HERE I AM")
        setProfileMenuOpen(!profileMenuOpen)
    }
    const closeMenu = () => {
        setProfileMenuOpen(false)
    }

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
            <Avatar user={user} toggleHandler={toggleMenu} />
            {
                (profileMenuOpen) ? <div>
                    <ol>
                        <li key="profilemenu1"><Link rel="intent" to={`/u/${user.username}@${user.instance}`} onClick={closeMenu}>Profile</Link></li>                        
                        <li key="profilemenu2">Settings</li>
                        <li key="profilemenu3">
                            <Form method="post" action="/auth/logout">
                                <button>Log out</button>
                            </Form>                            
                        </li>
                    </ol>
                </div> : <div/>
            }
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
