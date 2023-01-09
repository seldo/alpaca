import {follow,unfollow} from "~/shared/library/mastodon.client"

const handleFollow = async (authUser,account,isFollowing,setFollowing) => {
    if (isFollowing) {
        unfollow(authUser,account)
        setFollowing(false)
    } else {
        follow(authUser,account)
        setFollowing(true)
    }
}

export default function FollowButton({authUser,user,isFollowing,setFollowing}) {
    if (isFollowing) {
        return <button 
            className="genericButton followButton empty"
            onClick={(e) => handleFollow(authUser,user,isFollowing,setFollowing)}    
        >Following</button>
    } else {
        return <button 
            className="genericButton followButton filled"
            onClick={(e) => handleFollow(authUser,user,isFollowing,setFollowing)}    
        >Follow</button>
    }
}
