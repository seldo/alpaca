import { Authenticator } from "remix-auth";
import { sessionStorage, getSession, commitSession } from "./session.server";
import { MastodonStrategy } from "./mastodonstrategy.server"
import { prisma } from "~/db.server";

export let authenticator = new Authenticator(sessionStorage,{
  throwOnError: true
});

const getOrCreateInstance = async (instanceName) => {
  let conditions = {
    where: {
      name: instanceName
    }
  }
  let instanceData = await prisma.instance.findUnique(conditions)
  if (!instanceData) {
    let formData = new FormData();
    formData.append("client_name", process.env.OAUTH_APP_NAME)
    formData.append("website",process.env.OAUTH_APP_WEBSITE)
    formData.append("scopes","read write")
    formData.append("redirect_uris", process.env.THIS_HOST + "/auth/callback")
    let instanceUrl = "https://" + instanceName + "/api/v1/apps"
    
    let appData = await fetch(instanceUrl, {
      method: "POST",
      body: formData
    })
    let appCreated = await appData.json()
    // TODO: check for 200 etc.
    instanceData = await prisma.instance.create({
      data: {
        name: instanceName,
        url: "https://" + instanceName,
        clientKey: appCreated.client_id,
        clientSecret: appCreated.client_secret
      }
    })  
  }
  authenticator = authenticator.use(
    new MastodonStrategy(
      {
        authorizationURL: instanceData.url + "/oauth/authorize",
        tokenURL: instanceData.url + "/oauth/token",
        clientID: instanceData.clientKey,
        clientSecret: instanceData.clientSecret,
        callbackURL: process.env.THIS_HOST + "/auth/callback",
        instanceName: instanceName
      },
      async ({ accessToken, refreshToken, extraParams, profile, context }) => {
        console.log(instanceName,"access token",accessToken)
        console.log(instanceName,"extra params",extraParams)
        let userResponse
        try {
          userResponse = await fetch(process.env.MASTODON_INSTANCE + "/api/v1/accounts/verify_credentials", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${accessToken}`
            }
          })
        } catch(e) {
          console.log(instanceName,"error verifying credentials")
          console.log(e)
        }
        // FIXME: verify that they are the user they say they are on the right instance
        let user = await userResponse.json()
        user.instanceName = instanceName
        user.accessToken = accessToken
        user.tokenExpiry = extraParams
        return user
      }
    ),
    instanceName
  )
  return authenticator
}

export const authenticateAnyInstance = async (instanceName,request,options) => {

  // get or create an application against this instance
  let authenticator = await getOrCreateInstance(instanceName)
  await authenticator.authenticate(instanceName,request,options);

}

// TODO: load instance name from session here?
export const authenticateAndRefresh = async (request,options = {
    failureRedirect: "/auth/mastodon?aar",
    throwOnError: true
  }) => {
  console.log("authenticateandrefresh called with options",options)
  let authUser = await authenticator.isAuthenticated(request, options)
  if(authUser) console.log("...and it found a valid user",authUser.accessToken)
  return authUser
}
