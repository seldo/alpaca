import { redirect } from "@remix-run/node";
import authenticator from "../../../services/auth.server";

export const loader = async ({ request, params }) => {
  console.log("loader happened in mastodon")
  await authenticator.authenticate("Seldo.dev", request,{
    successRedirect: "/home",
    failureRedirect: "/auth/login?frommasto"
  });
};
