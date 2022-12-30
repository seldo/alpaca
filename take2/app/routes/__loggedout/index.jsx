import { useState, useEffect } from "react";
import { authenticate } from "~/shared/library/auth.client"
import { Form } from "@remix-run/react";
import { useNavigate } from "react-router-dom";
import { useFetcher } from "@remix-run/react";

export default function Index() {

  const navigate = useNavigate()

  useEffect( () => {
    (async () => {
      await authenticate(navigate,{
        success: "/home"
      })
    })();
  },[])

  return (
    <div className="container">
      <h2>It's an open source Mastodon client.</h2>

      <p id="toLogin">To login, enter your instance name.</p>
      <p id="instanceTip">If your mastodon handle is myname@some.domain, your instance name is "some.domain".</p>
      <div className="temporaryLogin">
        <form method="get" action="/auth/mastodon">
          <p>Instance name: <input type="text" name="instance" /></p>
          <button type="submit">Login</button>
        </form>
      </div>
      <p id="createOffer">If you don't have a mastodon account, you can create one over at <a href="https://alpaca.gold">alpaca.gold</a>.</p>
    </div>
  )
}
