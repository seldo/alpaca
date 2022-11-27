import authenticator from "../services/auth.server";
import { useLoaderData } from "@remix-run/react";

// if they're already logged in take them to the home timeline
export const loader = async ({request}) => {
    return await authenticator.isAuthenticated(request, {
        successRedirect: "/home"
    })
}

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Alpaca Blue</h1>
      <h2>An open source Mastodon client</h2>
      <p>Currently only works in dev against my test server.</p>
      <p><a href="/auth/mastodon">Login</a></p>
    </div>
  );
}
