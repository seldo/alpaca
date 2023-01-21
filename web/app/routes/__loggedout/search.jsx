import {
    useLoaderData,
    useNavigate,
    Form
} from "@remix-run/react";
import { useEffect, useState } from "react"
import Avatar from "~/shared/components/avatar"
import FollowButton from "~/shared/components/followbutton"
import { search } from "~/shared/library/mastodon.client"
import { useOutletContext } from "react-router-dom";
import { Post } from "~/shared/components/post"

export const loader = async ({ request, params }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q");
    return { q }
}

export const meta = ({ data }) => {
    return {
        title: `Search | Alpaca Blue: a Mastodon client`,
    }
}

export default function Index() {
    let { q } = useLoaderData()
    const navigate = useNavigate()
    const { authUser } = useOutletContext()
    const [value, setValue] = useState(q);
    const [results, setResults] = useState();
    const [repliesOpen, setRepliesOpen] = useState(false)
    const [showLightbox,setShowLightbox] = useState(false)

    const onChange = (event) => {
        setValue(event.target.value);
    };

    useEffect(() => {
        (async () => {
            if(authUser && q) {
                let incomingResults = await search(authUser, q)
                setResults(incomingResults)    
            }
        })();
    }, [authUser])

    return <div className="searchPage">
        <div className="searchBox">
            <Form reloadDocument method="get">
                <input className="searchInput" type="text" name="q" placeholder="People, posts, whatever" value={value} onChange={onChange} />
                <button className="button">Search</button>
            </Form>
        </div>
        {
            (!results || (results.accounts.length == 0 && results.statuses.length == 0 && results.hashtags.length == 0)) ? <div className="searchResults">Did not find anything.</div> : <div className="searchResults">
                {(results.accounts.length > 0) ? <div>
                    <h2>Accounts</h2>
                    <ul>
                        {results.accounts.map((r, index) => {
                            return <li key={`accounts_${index}`} className="miniProfile searchResult">
                                <div className="flex flex-row">
                                    <Avatar user={r} />
                                    <div className="words nextToAvatar grow">
                                        <div className="name">
                                            <span className="displayName">{r.display_name}</span>
                                            <span className="username">{r.username}@{r.instance}</span>
                                        </div>
                                        <div
                                            className="note"
                                            dangerouslySetInnerHTML={{ __html: r.note }}
                                        />
                                    </div>
                                    <FollowButton username={r.username} instance={r.instance} following={r.following} />
                                </div>
                            </li>
                        })
                        }
                    </ul>
                </div> : <div />
                }
                {(results.statuses.length > 0) ? <div>
                    <h2>Statuses</h2>
                    <ul>
                        {results.statuses.map((r, index) => {
                            return <li key={`statuses_${index}`} className="miniStatus searchResult">
                                <Post post={r} options={{ avatar: true, navigate, authUser, showLightbox, setShowLightbox}} />
                            </li>
                        })
                        }
                    </ul>
                </div> : <div />
                }
                {(results.accounts.length > 0) ? <div>
                    <h2>Hashtags</h2>
                    <ul>
                        {results.hashtags.map((r, index) => {
                            return <li key={`hashtags_${index}`} className="miniHashtag searchResult">
                                {JSON.stringify(r)}
                            </li>
                        })
                        }
                    </ul>
                </div> : <div />
                }
            </div>
        }
    </div>
}
