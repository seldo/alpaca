import { Link, useLoaderData, useOutletContext } from "@remix-run/react";

export const loader = async ({request}) => {
  // We're not doing anything additional with the user here
  // So we don't need to do the gross double-loading of user
  // We can just get it from the context
  // and our route in __loggedin means we're already authed
  return null
}  

export default function Index() {
  const { user } = useOutletContext()

  return (
    <main>
      <h1>This is a private page, it requires auth.</h1>
      <p>You are logged in as {user.username}.</p>
    </main>
  );
}
