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

      <p id="toLogin">To login, enter your instance name.</p>
      <p id="instanceTip">If your mastodon handle is myname@some.domain, your instance name is "some.domain".</p>
      <div className="temporaryLogin">
        <Form method="get" action="/auth/mastodon">
          <p>Instance name: <input type="text" name="instance" /></p>
          <button type="submit">Login</button>
        </Form>
      </div>
      <p id="createOffer">If you don't have a mastodon account, you can create one over at <a href="https://alpaca.gold">alpaca.gold</a>.</p>
    </div>
  );
}
