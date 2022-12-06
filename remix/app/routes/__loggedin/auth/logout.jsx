import { useLoaderData, Form } from "@remix-run/react";
import { sessionStorage } from "~/services/session.server";
import { authenticateAndRefresh, logoutAnyInstance } from "~/services/auth.server";

export async function action({ request }) {
    //await authenticator.logout(request, { redirectTo: "/" });
    await logoutAnyInstance(request,{redirectTo: "/"})
}

export const loader = async ({request}) => {
    let user = await authenticateAndRefresh(request,{
        failureRedirect: "/?alreadyloggedout"
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
