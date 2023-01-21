import { useState, useEffect } from "react";
import { logout } from "~/shared/library/auth.client"
import { useNavigate } from "react-router-dom";

export default function Index() {

  const navigate = useNavigate();

  useEffect( () => {
    (async () => {
      logout(navigate)
    })();
  },[])

  return (
    <div className="container">
      Logging out of your shiz.
    </div>
  )
}
