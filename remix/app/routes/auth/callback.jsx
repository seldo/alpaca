import { useLoaderData } from "@remix-run/react";
import { sessionStorage } from "../../services/session.server";
import { authenticator } from "../../services/auth.server";

export const loader = async ({ request }) => {
    console.log("/callback loader called")
    try {
        await authenticator.authenticate("Seldo.dev", request, {
            successRedirect: "/private?1",
            failureRedirect: "/auth/login?failed",
        });
    } catch (e) {
        console.log("/callback threw redirect")
        console.log(e)
        throw e
    }
    console.log("/callback didn't wait")
}

export default function Callback() {
    console.log("/callback default function got called")
    return (
        <div>Callback</div>
    )
}