import { useLoaderData, Form } from "@remix-run/react";
import { sessionStorage } from "../../../services/session.server";
import { authenticator } from "../../../services/auth.server";

export async function action({ request }) {
    await authenticator.logout(request, { redirectTo: "/auth/login?justloggedout" });
};

export const loader = async ({request}) => {
    let user = await authenticator.isAuthenticated(request, {
        failureRedirect: "/auth/login?fromlogout"
    })
    return { user }
}  

export default function Index() {
    return (
        <div>
            You're logged in.
            <Form method="post">
                <button>Log out</button>
            </Form>
        </div>
    )
}
