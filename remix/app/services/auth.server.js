// app/services/auth.server.ts
import { Authenticator } from "remix-auth";
import { sessionStorage } from "./session.server";
import { OAuth2Strategy } from "remix-auth-oauth2"

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export let authenticator = new Authenticator(sessionStorage,{
  throwOnError: true
});

authenticator.use(
    new OAuth2Strategy(
      {
        authorizationURL: "https://seldo.dev/oauth/authorize",
        tokenURL: "https://seldo.dev/oauth/token",
        clientID: process.env.CLIENT_KEY,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/callback"
      },
      async ({ accessToken, refreshToken, extraParams, profile, context }) => {
        // here you can use the params above to get the user and return it
        // what you do inside this and how you find the user is up to you
        console.log("Getting the fucking user")
        let userResponse
        try {
          userResponse = await fetch("https://seldo.dev/api/v1/accounts/verify_credentials", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${accessToken}`
            }
          })
        } catch(e) {
          console.log("error")
          console.log(e)
        }
        return await userResponse.json()
      }
    ),
    // this is optional, but if you setup more than one OAuth2 instance you will
    // need to set a custom name to each one
    "Seldo.dev"
  );

export default authenticator