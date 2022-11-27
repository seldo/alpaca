import { useLoaderData } from "@remix-run/react";
import authenticator from "../services/auth.server";
import * as mastodon from "../models/tweets.server";

export const loader = async ({request}) => {
    let authUser = await authenticator.isAuthenticated(request, {
        failureRedirect: "/auth/mastodon?fromhome"
    })
    let user = await mastodon.getOrCreateUser(authUser)
    let timeline = await mastodon.fetchTweets(authUser)
    console.log(timeline)
    user.tweets = timeline
    return { user }
}  

export default function Index() {
  const { user } = useLoaderData();

  return (
    <div>
      <div class="userdata">
        <p>User: {user.display_name || user.username }</p>
      </div>
      <h1>Tweets</h1>
      <ul>
        {
          user.tweets? user.tweets.map(t => {
            return (
              <li dangerouslySetInnerHTML={{__html: t.content}} />
            )
          }) : <li>No tweets yet. Give it a sec.</li>
        }
      </ul>
    </div>
  );
}
