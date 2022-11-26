import { useLoaderData } from "@remix-run/react";
import authenticator from "../../services/auth.server";

export let loader = async ({request}) => {

  let user = await authenticator.isAuthenticated(request)
  if( user ) {
    console.log("authenticated!")
    console.log(user)
    return true
  } else {
    console.log("Not authenticated")
    console.log(user)
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