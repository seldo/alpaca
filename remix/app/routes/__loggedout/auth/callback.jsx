import { authenticator, authenticateAnyInstance } from "~/services/auth.server";
import { sessionStorage, getSession } from "~/services/session.server";

export const loader = async ({ request }) => {
    console.log("/callback loader called")
    let session = await getSession(request.headers.get("Cookie"))
    let instanceName = session.get("oauth2:state")
    console.log("Cookie stored instance name as " + instanceName)
    console.log("Authenticator was",authenticator)
    try {
        await authenticateAnyInstance(instanceName,request,{
            successRedirect: "/home",
            failureRedirect: "/auth/login?failed",
        })
        /*
        await authenticator.authenticate("seldo.dev", request, {
            successRedirect: "/home",
            failureRedirect: "/auth/login?failed",
        });
        */
    } catch (e) {
        console.log("/callback threw redirect")
        //console.log(e)
        throw e
    }
}
