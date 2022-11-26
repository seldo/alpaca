import { useLoaderData } from "@remix-run/react";
import { sessionStorage } from "../../services/session.server";
import { authenticator } from "../../services/auth.server";

export const loader = async ({ request }) => {
    console.log("Callback called")
    await authenticator.authenticate("Seldo.dev", request, {
        successRedirect: "/private",
        failureRedirect: "/auth/login?failed",
    });
}