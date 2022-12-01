import { Link } from "@remix-run/react";

// FIXME: two instances of this function so far
function getInstanceFromData(userData) {
    if(userData.instance) return userData.instance
    let acctInstance = userData.acct.split('@')[1]
    if (acctInstance) return acctInstance
    let urlInstance = userData.url.split('//')[1].split('/')[0]
    return urlInstance
  }  

export default function Avatar({user}) {
    if (user) {
        return <div className="user">
            <Link to={`/u/${user.username}@${getInstanceFromData(user)}`}><img className="avatar" src={user.avatar} title={user.display_name || user.username } /></Link>
        </div>
    } else {
        return <div />
    }
}
