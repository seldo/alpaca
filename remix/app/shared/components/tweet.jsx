export default Tweet = (t) => {
    if(t.reblog !== null) {
        let r = t.reblog
        return <div className="reblog">
            <div className="reblogNotice">{r.account.display_name || "@" + r.account.username} reblogged</div>
            <li className="tweet flex flex-row w-full" key={r.id}>
            <div className="gutter">
            <div className="authorAvatar">
                <img src={r.account.avatar} />
            </div>
            </div>
            <div className="tweetBody grow">
            <div className="author">
                <span className="displayName">{r.account.display_name}</span>
                <span className="username">@{r.account.acct}</span>
            </div>
            <div className="status" dangerouslySetInnerHTML={{__html: r.content}} />
            <div className="reactions flex flex-row place-content-between w-full">
                <div className="replies">{r.replies_count ? r.replies_count : ''}</div>
                <div className="reblogs">{r.reblogs_count ? r.reblogs_count : ''}</div>
                <div className="favorites">{r.favourites_count ? r.favourites_count : ''}</div>
                <div className="share"><span>Share</span></div>
            </div>
            </div>
        </li>
        </div>
    } else {
        return <li className="tweet flex flex-row w-full" key={t.id}>
            <div className="gutter">
            <div className="authorAvatar">
                <img src={t.account.avatar} />
            </div>
            </div>
            <div className="tweetBody grow">
            <div className="author">
                <span className="displayName">{t.account.display_name}</span>
                <span className="username">@{t.account.acct}</span>
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
