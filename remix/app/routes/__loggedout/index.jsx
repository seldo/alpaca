import { authenticateAndRefresh } from "~/services/auth.server";
import stylesRoot from "~/../styles/root.css";
import { Form } from "@remix-run/react";

// if they're already logged in take them to the home timeline
export const loader = async ({request}) => {
  console.log("/ called")
  let user = await authenticateAndRefresh(request,{
      successRedirect: "/home",
      throwOnError: false
  })
  return null
}

export default function Index() {
  return (
    <div className="container">
      <h2>It's an open source Mastodon client.</h2>
      <p>I'm sorry.</p>
      <p>To login, enter your instance name (if your mastodon handle is myname@some.domain, your instance name is "some.domain").</p>
      <div className="temporaryLogin">
        <Form method="get" action="/auth/mastodon">
          <p>Instance name: <input type="text" name="instance" /></p>
          <button type="submit">Login</button>
        </Form>
      </div>
      <p>If you don't have a mastodon account you can create one over at <a href="https://seldo.dev">seldo.dev</a> but it's a test server so don't expect it to be around forever.</p>
    </div>
  );
}
