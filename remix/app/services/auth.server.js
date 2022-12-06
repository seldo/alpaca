import { Authenticator } from "remix-auth";
import { sessionStorage, getSession, commitSession } from "./session.server";
import { MastodonStrategy } from "./mastodonstrategy.server"
import { prisma } from "~/db.server";
import { redirect } from "@remix-run/node";

export let authenticator

const getOrCreateInstance = async (instanceName) => {
  console.log("getOrCreateInstance called with instance",instanceName)
  authenticator = new Authenticator(sessionStorage,{
    throwOnError: true
  });

  let conditions = {
    where: {
      name: instanceName
    }
  }
  let instanceData = await prisma.instance.findUnique(conditions)
  let callbackURI = process.env.THIS_HOST + "/auth/callback"
  if (!instanceData || !instanceData.clientKey || !instanceData.clientSecret) {
    let formData = new FormData();
    formData.append("client_name", process.env.OAUTH_APP_NAME)
    formData.append("redirect_uris", callbackURI)
    formData.append("scopes","read write")
    formData.append("website",process.env.OAUTH_APP_WEBSITE)
    let instanceUrl = "https://" + instanceName + "/api/v1/apps"
    
    let appData = await fetch(instanceUrl, {
      method: "POST",
      body: formData
    })
    let appCreated = await appData.json()
    console.log("App created",appCreated)
    // TODO: check for 200 etc.
    instanceData = await prisma.instance.upsert({
      where: {
        name: instanceName
      },
      update: {
        clientKey: appCreated.client_id,
        clientSecret: appCreated.client_secret
      },
      create: {
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
        callbackURL: callbackURI,
        instanceName: instanceName
      },
      async ({ accessToken, refreshToken, extraParams, profile, context }) => {
        console.log(instanceName,"access token",accessToken)
        console.log(instanceName,"extra params",extraParams)
        let userResponse
        try {
          userResponse = await fetch(instanceData.url + "/api/v1/accounts/verify_credentials", {
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
        user.instance = instanceName
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
  return await authenticator.authenticate(instanceName,request,options);

}

export const logoutAnyInstance = async(request,options) => {
  let session = await getSession(request.headers.get("Cookie"))
  let instanceName = session.get("oauth2:state")
  let authenticator = await getOrCreateInstance(instanceName)
  await authenticator.logout(request, { redirectTo: "/" });
}

// TODO: load instance name from session here?
export const authenticateAndRefresh = async (request,options = {
    failureRedirect: "/auth/mastodon?aar",
    throwOnError: true
  }) => {
  console.log("authenticateAndRefresh")
  let session = await getSession(request.headers.get("Cookie"))
  let instanceName = session.get("oauth2:state")
  if(!instanceName) {
    console.log("AAR didn't find instance name")
    if (options.throwOnError) throw redirect(options.failureRedirect)
    else return null
  }
  let authenticator = await getOrCreateInstance(instanceName)
  //console.log("instantiated authenticator for instance",instanceName)
  try {
    let authUser = await authenticator.isAuthenticated(request, options)
    if(!authUser || authUser.error) {
      if(options.throwOnError) throw redirect(options.failureRedirect)
      else return null
    } else {
      console.log("auth.server says:",authUser.username,'@',authUser.instance)
      return authUser
    }
  } catch (e) {
    console.log("authenticateandrefresh did not find valid user")
    throw e
  }
}
