import { useLoaderData } from "@remix-run/react";
import authenticator from "../../services/auth.server";

export let loader = ({request}) => {

  console.log("request")
  console.log(request)

  if( authenticator.isAuthenticated(request) ) {
    console.log("authenticated!")
    return true
  } else {
    return false
    /*
    return (
      <div>
        <form method="get" action="/auth/mastodon">
          <button>Login</button>
        </form>
      </div>
    )
    */
  }

}

export default () => {
  let loggedIn = useLoaderData()
  if(loggedIn) {
    return (
      <div>You are logged in!!!</div>
    )  
  } else {
    return (
      <div>
        <form method="get" action="/auth/mastodon">
          <button>Login</button>
        </form>
      </div>
    )   
  }
}