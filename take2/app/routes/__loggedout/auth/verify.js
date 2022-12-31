import { useState, useEffect } from "react";
import { validate } from "~/shared/library/auth.client"
import { useNavigate } from "react-router-dom";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  return {code}
};

export default function Verify() {

  const {code} = useLoaderData();
  const navigate = useNavigate();

  useEffect( () => {
    (async () => {
      validate(navigate,code)
    })();
  },[])

  return (
    <div className="container">
      Confirming your permissions...
    </div>
  )
}
