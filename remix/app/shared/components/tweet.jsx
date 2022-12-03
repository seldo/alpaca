import Avatar from "~/shared/components/avatar"
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import { Link } from "react-router-dom";

// FIXME: this gets called lots of times, call it once.
TimeAgo.addLocale(en)
const timeAgo = new TimeAgo('en-US')

export const getInstanceFromAccount = (account) => {
    let acctInstance = account.acct.split('@')[1]
    if (acctInstance) return acctInstance
    let urlInstance = account.url.split('//')[1].split('/')[0]
    return urlInstance
  }  

export const LinkToAccount = (account,content) => {
    account.instance = getInstanceFromAccount(account)
    let profileLink = `/u/${account.username}@${account.instance}`
    return <Link to={profileLink}>{(account.display_name || "@" + account.username)}</Link>
}

const Tweet = (t,options = {
        avatar: true
    }) => {
    console.log(t)
    if(t.reblog !== null) {
        return <div className="reblog">
            <div className="reblogNotice">
                { LinkToAccount(t.account) } reblogged
            </div>
            {Tweet(t.reblog)}
        </div>
    } else {
        //console.log(t)
        return <li key={t.id} className="tweet flex flex-row w-full">
            <div className="gutter">            
            {
                (options.avatar) ? <div className="authorAvatar">
                    <Avatar user={t.account} /> 
                </div> : <div />
            }
            </div>
            <div className="tweetBody nextToAvatar grow">
                <div className="author">
                    <span className="displayName">{t.account.display_name}</span>
                    <span className="username">@{t.account.acct}</span>
                    <span className="time">{timeAgo.format(Date.parse(t.created_at),'twitter')}</span>
                </div>
                <div className="status" dangerouslySetInnerHTML={{__html: t.content}} />
                <div className="reactions flex flex-row place-content-between w-full">
                    <div className="replies">{t.replies_count ? t.replies_count : ''}</div>
                    <div className="reblogs">{t.reblogs_count ? t.reblogs_count : ''}</div>
                    <div className="favorites">{t.favourites_count ? t.favourites_count : ''}</div>
                    <div className="share"><span>Share</span></div>
                </div>
            </div>
        </li>
    }
  }

export { Tweet }
export default Tweet
  