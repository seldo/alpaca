import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import stylesUrl from "./styles/root.css";

export const links = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
}

export const meta = () => ({
  charset: "utf-8",
  title: "Alpaca Blue: a Mastodon client",
  viewport: "width=device-width,initial-scale=1",
});

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
