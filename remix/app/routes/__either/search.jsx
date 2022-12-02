import { 
    useLoaderData, 
    useNavigate,
    Form
} from "@remix-run/react";
import { useState } from "react"
import authenticator from "~/services/auth.server";
import * as mastodon from "~/models/tweets.server";
import Avatar from "~/shared/components/avatar"
import FollowButton from "~/shared/components/followbutton"

// maybe search is a GET so a loader makes sense
export const loader = async ({request, params}) => {
    // FIXME: authentication should be optional
    let authUser = await authenticator.isAuthenticated(request, {
        failureRedirect: "/auth/mastodon?temporaryfromsearch",
        throwOnError: true
    })
    const url = new URL(request.url);
    const q = url.searchParams.get("q");
    let results = await mastodon.search(q,{
        token: authUser.accessToken
    })
    console.log("masto search returned",results)
    return {q,results}
}

export const meta = ({data}) => {
    return {
        title: `Search | Alpaca Blue: a Mastodon client`,
    }
}

// FIXME: *3* copies of this?
function getInstanceFromData(userData) {
    let acctInstance = userData.acct.split('@')[1]
    if (acctInstance) return acctInstance
    let urlInstance = userData.url.split('//')[1].split('/')[0]
    return urlInstance
  }

export default function Index() {
    let {q,results} = useLoaderData()

    const [value, setValue] = useState(q);
    const onChange = (event) => {
      setValue(event.target.value);
    };

    return <div className="searchPage">
        <div className="searchBox">
            <Form className="flex flow-row" reloadDocument method="get">
                <input className="grow" type="text" name="q" placeholder="People, tweets, whatever" value={value} onChange={onChange} />
                <button className="grow-0 genericButton">Search</button>
            </Form>
        </div>
        {
            (!results || (results.accounts.length == 0 && results.statuses.length == 0 && results.hashtags.length == 0)) ? <div class="searchResults">Did not find anything.</div> : <div className="searchResults">
                { (results.accounts.length > 0) ? <div>
                        <h2>Accounts</h2>
                        <ul>
                        { results.accounts.map( r => {
                                return <div className="miniProfile searchResult">
                                    <div className="flex flex-row">
                                        <Avatar user={r} />
                                        <div className="words nextToAvatar">
                                            <div className="name">
                                                <span className="displayName">{r.display_name}</span>
                                                <span className="username">{r.username}@{getInstanceFromData(r)}</span>
                                            </div>
                                            <div 
                                                className="note" 
                                                dangerouslySetInnerHTML={{__html: r.note}} 
                                            />
                                        </div>
                                        <FollowButton username={r.username} instance={getInstanceFromData(r)} following={r.following} />
                                    </div>

                                </div>
                            })
                        }
                        </ul>
                    </div> : <div />
                }
                { (results.statuses.length > 0) ? <div>
                        <h2>Statuses</h2>
                        <ul>
                        { results.statuses.map( r => {
                                return <div className="miniStatus searchResult">
                                    {JSON.stringify(r)}
                                </div>
                            })
                        }
                        </ul>
                    </div> : <div />
                }
                { (results.accounts.length > 0) ? <div>
                        <h2>Hashtags</h2>
                        <ul>
                        { results.hashtags.map( r => {
                                return <div className="miniHashtag searchResult">
                                    {JSON.stringify(r)}
                                </div>
                            })
                        }
                        </ul>
                    </div> : <div />
                }
            </div>
        }
    </div>
}
