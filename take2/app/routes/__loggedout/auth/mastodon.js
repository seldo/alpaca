import { useState, useEffect } from "react";
import { authenticate } from "~/shared/library/auth.client"
import { useNavigate } from "react-router-dom";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const instance = url.searchParams.get("instance");
  return {instance}
};

export default function Mastodon() {

  const {instance} = useLoaderData();
  const navigate = useNavigate();

  useEffect( () => {
    (async () => {
      let userAuth = authenticate(navigate,{
        instance
      })
    })();
  },[])

  return (
    <div className="container">
      Contacting your server for permission...
    </div>
  )
}
