import authenticator from "../../services/auth.server";
import stylesRoot from "~/../styles/root.css";

export const links = () => {
  return [
    { rel: "stylesheet", href: stylesRoot }
  ];
}

// if they're already logged in take them to the home timeline
export const loader = async ({request}) => {
    return await authenticator.isAuthenticated(request, {
        successRedirect: "/home"
    })
}

export default function Index() {
  return (
    <div className="container mx-auto px-4">
      <h1>Alpaca Blue</h1>
      <h2>An open source Mastodon client</h2>
      <p>Currently only works in dev against my test server.</p>
      <p><a href="/auth/mastodon">Login</a></p>
    </div>
  );
}
