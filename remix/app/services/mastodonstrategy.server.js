// We need to import the OAuth2Strategy, the verify params and the profile interfaces
import { OAuth2Strategy } from "remix-auth-oauth2";

// And we create our strategy extending the OAuth2Strategy, we also need to
// pass the User as we did on the FormStrategy, we pass the Auth0Profile and the
// extra params
export class MastodonStrategy extends OAuth2Strategy {  

  name = "Mastodon"

  // We receive our custom options and our verify callback
  constructor(
    options,
    verify
  ) {
    super(
      {
        authorizationURL: options.authorizationURL,
        tokenURL: options.tokenURL,
        clientID: options.clientID,
        clientSecret: options.clientSecret,
        callbackURL: options.callbackURL
      },
      verify
    );

    this.instanceName = options.instanceName || "didn't get one"

    this.scope = options.scope || "read write";
  }

  // We override the protected authorizationParams method to return a new
  // URLSearchParams with custom params we want to send to the authorizationURL.
  // Here we add the scope so Auth0 can use it, you can pass any extra param
  // you need to send to the authorizationURL here base on your provider.
  authorizationParams() {
    const urlSearchParams = {
      scope: this.scope
    };

    return new URLSearchParams(urlSearchParams);
  }

  generateState() {
    return this.instanceName
  }

}
