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

    useEffect( () => {
        (async () => {
          let user = await authenticate(navigate,{
            failure: '/'
          })
          setAuthUser(user)
        })();
      },[])    

    return <div className="loggedIn" >
        <Globalnav 
          user={authUser ? authUser.user : null} 
          navigate={navigate} 
          isHome={isHome} 
          pathname={pathname}
          profileMenuOpen={profileMenuOpen} 
          setProfileMenuOpen={setProfileMenuOpen} 
        />
        <div className="content">
            <Outlet context={{authUser}} />
        </div>
    </div>
}
