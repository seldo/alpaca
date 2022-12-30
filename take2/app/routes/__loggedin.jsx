import { Outlet } from "@remix-run/react";
import Globalnav from "~/shared/components/globalnav"
import { authenticate } from "~/shared/library/auth.client";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Index() {

    const navigate = useNavigate()
    const [authUser,setAuthUser] = useState()
    const [profileMenuOpen,setProfileMenuOpen] = useState(false)

    useEffect( () => {
        (async () => {
          let user = await authenticate(navigate,{
            success: "/home"
          })
          setAuthUser(user)
        })();
      },[])    

    return <div className="loggedIn">
        <Globalnav user={authUser ? authUser.user : null} navigate={navigate} isHome={true} profileMenuOpen={profileMenuOpen} setProfileMenuOpen={setProfileMenuOpen} />
        <div className="content">
            <Outlet />
        </div>
    </div>
}
