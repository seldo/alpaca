import { redirect } from "@remix-run/node";
import authenticator from "../../services/auth.server";

export const loader = async ({ request, params }) => {
  console.log("loader happened")
  return await authenticator.authenticate("Seldo.dev", request);
};