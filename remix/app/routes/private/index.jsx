import { Link, useLoaderData } from "@remix-run/react";
import authenticator from "../../services/auth.server";

export const loader = async ({request}) => {
    console.log("Here I am in /private")
    let user = await authenticator.isAuthenticated(request, {
        failureRedirect: "/auth/login?frompriv"
    })
    return { user }
}  

export default function Index() {
  const { user } = useLoaderData();
    console.log("Private page, user is")
  console.log(user)

  return (
    <main>
      <h1>This is a private page</h1>
      <p>It asks if you're logged in.</p>
    </main>
  );
}