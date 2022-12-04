import { authenticateAndRefresh } from "~/services/auth.server";
import stylesRoot from "~/../styles/root.css";
import { Form } from "@remix-run/react";

// if they're already logged in take them to the home timeline
export const loader = async ({request}) => {
  console.log("/ called")
  let user = await authenticateAndRefresh(request,{
      successRedirect: "/home",
      failureRedirect: false,
      throwOnError: false
  })
  return null
}

export default function Index() {
  return (
    <div className="container mx-auto px-4">
      <h1>Alpaca Blue</h1>
      <h2>An open source Mastodon client</h2>
      <div>
        <Form method="get" action="/auth/mastodon">
          <p>Instance name: <input type="text" name="instance" /></p>
          <button type="submit">Login</button>
        </Form>
      </div>
    </div>
  );
}
