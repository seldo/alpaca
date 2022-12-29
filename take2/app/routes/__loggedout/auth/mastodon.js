import { useState, useEffect } from "react";
import { authenticate } from "~/shared/library/auth.client"
import { Form } from "@remix-run/react";
import { useNavigate } from "react-router-dom";

export default function Mastodon(request) {

  useEffect( () => {
    console.log(request)
  },[])

  return (
    <div className="container">
      Loading your shiz.
    </div>
  )
}
