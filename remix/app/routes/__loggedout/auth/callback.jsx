import { authenticator } from "~/services/auth.server";

export const loader = async ({ request }) => {
    console.log("/callback loader called")
    try {
        await authenticator.authenticate("Seldo.dev", request, {
            successRedirect: "/home",
            failureRedirect: "/auth/login?failed",
        });
    } catch (e) {
        console.log("/callback threw redirect")
        //console.log(e)
        throw e
    }
}
