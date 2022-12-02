// We need to import the OAuth2Strategy, the verify params and the profile interfaces
import { OAuth2Strategy } from "remix-auth-oauth2";

// And we create our strategy extending the OAuth2Strategy, we also need to
// pass the User as we did on the FormStrategy, we pass the Auth0Profile and the
// extra params
export class MastodonStrategy extends OAuth2Strategy {
  // The OAuth2Strategy already has a name but we override it to be specific of
  // the service we are using
  name = "mastodonauth";

  // We receive our custom options and our verify callback
  constructor(
    options,
    verify
  ) {
    // And we pass the options to the super constructor using our own options
    // to generate them, this way we can ask less configuration to the developer
    // using our strategy
    super(
      {
        authorizationURL: options.authorizationURL,
        tokenURL: options.tokenURL,
        clientID: options.clientID,
        clientSecret: options.clientSecret,
        callbackURL: options.callbackURL,
      },
      verify
    );

    this.scope = options.scope || "read write";
  }

  // We override the protected authorizationParams method to return a new
  // URLSearchParams with custom params we want to send to the authorizationURL.
  // Here we add the scope so Auth0 can use it, you can pass any extra param
  // you need to send to the authorizationURL here base on your provider.
  authorizationParams() {
    const urlSearchParams = {
      scope: this.scope,
    };

    return new URLSearchParams(urlSearchParams);
  }
}
