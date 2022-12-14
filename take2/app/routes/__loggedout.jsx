import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Outlet, useMatches } from "@remix-run/react";
import Globalnav from "~/shared/components/globalnav"
import { authenticate } from "~/shared/library/auth.client";

export default function Index() {

    const navigate = useNavigate()
    const matches = useMatches();
    const [authUser,setAuthUser] = useState()
    const [profileMenuOpen,setProfileMenuOpen] = useState(false)

    let pathname = matches[matches.length-1].pathname
    let isHome = false
    if (pathname == "/home" || pathname == "/") isHome = true;

    // loggedout case knows if you're logged in, but it's optional
    useEffect( () => {
        (async () => {
          let user = await authenticate(navigate)
          setAuthUser(user)
        })();
      },[])    

    return <div className="loggedOut">
        <Globalnav 
          user={authUser ? authUser.user : null} 
          navigate={navigate} 
          pathname={pathname}
          isHome={isHome} 
          profileMenuOpen={profileMenuOpen} 
          setProfileMenuOpen={setProfileMenuOpen} 
        />
        <div className="content">
            <Outlet context={{authUser}} />
        </div>
    </div>
}
