import { useLoaderData, Form } from "@remix-run/react";
import authenticator from "../../../services/auth.server";

export let loader = async ({request}) => {

  let user = await authenticator.isAuthenticated(request)
  if( user ) {
    console.log("Login says: authenticated!")
    console.log(user)
    return user
  } else {
    console.log("Login says: not authenticated")
    console.log(user)
    return false
  }

}

export default function Login() {
  let user = useLoaderData()
  if(user) {
    return (
      <div>You are logged in!!!</div>
    )  
  } else {
    return (
      <div>
        <Form method="get" action="/auth/mastodon">
          <p>Instance name: <input type="text" name="instance" /></p>
          <button type="submit">Login</button>
        </Form>
      </div>
    )   
  }
}
