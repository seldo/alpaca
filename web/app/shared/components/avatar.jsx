import { Link } from "@remix-run/react";

function getInstanceFromData(userData) {
    let acctInstance = userData.acct.split('@')[1]
    if (acctInstance) return acctInstance
    let urlInstance = userData.url.split('//')[1].split('/')[0]
    return urlInstance
  }

export default function Avatar({user,toggleHandler=false}) {
    if (user) {
        return <div className="avatar">
            <Link 
                rel="intent" 
                to={`/u/${user.username}@${user.instance||getInstanceFromData(user)}`} 
                onClick={toggleHandler?toggleHandler:(e) => e.stopPropagation()}><img className="avatarImage" src={user.avatar} title={user.display_name || user.username } /></Link>
        </div>
    } else {
        return <div />
    }
}
