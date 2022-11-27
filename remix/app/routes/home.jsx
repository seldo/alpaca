import { useLoaderData } from "@remix-run/react";
import authenticator from "../services/auth.server";
import * as mastodon from "../models/tweets.server";

export const loader = async ({request}) => {
    let authUser = await authenticator.isAuthenticated(request, {
        failureRedirect: "/auth/mastodon?fromhome"
    })
    let user = await mastodon.getOrCreateUser(authUser)
    console.log("got user")
    console.log(user)
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
              <li>
                {t}
              </li>
            )
          }) : <li>No tweets yet. Give it a sec.</li>
        }
      </ul>
    </div>
  );
}
