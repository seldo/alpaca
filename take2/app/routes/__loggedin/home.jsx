import { useState, useEffect } from "react";
import { authenticate } from "~/shared/library/auth.client"
import { useNavigate } from "react-router-dom";

export default function Home() {

    const navigate = useNavigate();
    const [authUser,setAuthUser] = useState()

    useEffect(() => {
        (async () => {
            let authUser = await authenticate(navigate, {
                failure: "/?failed"
            })
            setAuthUser(authUser)
        })();
    }, [])

    return (
        <div className="container">
            You're logged in!
            { authUser ? <div>
                    Hi there, {authUser.user.display_name}!
                </div> : <div></div>
            }
        </div>
    )
}
