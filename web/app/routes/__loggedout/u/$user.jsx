import { useState, useEffect } from "react"
import { Link, useOutletContext } from "react-router-dom"
import { useLoaderData } from "@remix-run/react"
import { getProfile, isFollowing } from "~/shared/library/mastodon.client"
import Avatar from "~/shared/components/avatar"
import FollowButton from "~/shared/components/followbutton"
import { Post } from "~/shared/components/post"
import { useNavigate } from "react-router-dom";

export const loader = async ({ request, params }) => {
    const [username, userInstance] = params.user.split("@")
    return {username,userInstance}
}

export default function Index() {

    let {username,userInstance} = useLoaderData()
    const { authUser } = useOutletContext()
    const navigate = useNavigate()
    const [posts,setPosts] = useState([])
    const [user,setUser] = useState()
    const [following,setFollowing] = useState(false)
    const [showLightbox,setShowLightbox] = useState(false)

    useEffect( () => {
        (async () => {
            try {
                let {account,statuses} = await getProfile(authUser,username,userInstance)
                if (account) {
                    setUser(account)
                    setPosts(statuses)
                }
                if(authUser) {
                    let followStatus = await isFollowing(authUser,account)
                    console.log("Followstatus now",followStatus)
                    setFollowing(followStatus)
                }
            } catch (e) {
                // if we double-query and it throws an error we just ignore it
                console.log("Boing")
            }
        })();
      },[username,authUser])

    if (!user) return <div></div>
    else return <div className="profilePage">
        <div className="profileTopNav flex flex-row">
            <Link to="/" onClick={() => navigate(-1)}><div className="backButton"></div></Link>
            <div>
                <div className="displayName">{user.display_name || user.username}</div>
                <div className="postCount">{user.statuses_count} posts</div>
            </div></div>
        <div className="profileHeader">
            <div className="headerContainer">
                <img src={user.header} />
            </div>
            <div className="avatarContainer">
                <Avatar user={user} />
            </div>
        </div>
        <div className="buttonBar">
            <FollowButton 
                authUser={authUser}
                user={user}
                isFollowing={following.following}
                setFollowing={setFollowing} 
            />
        </div>
        <div className="descriptions">
            <div className="displayName">
                {user.display_name || user.username}
            </div>
            <div className="note" dangerouslySetInnerHTML={{ __html: user.note }} />
            <div className="followerCounts">
                <span className="followingCount"><span className="number">{user.following_count}</span> Following</span>
                <span className="followersCount"><span className="number">{user.followers_count}</span> Followers</span>
            </div>
        </div>
        <div>
            <ul>
                {
                    (posts && posts.length > 0) ? posts.map(p => {
                        return <li key={p.id}><Post post={p} options={{ avatar: true, navigate: navigate, showLightbox, setShowLightbox }}/></li>
                    }) : <li key="noPosts">No posts yet. Give it a sec.</li>
                }
            </ul>
        </div>
    </div>
}
