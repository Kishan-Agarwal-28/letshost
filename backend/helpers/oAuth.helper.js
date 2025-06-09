import { AuthorizationCode } from "simple-oauth2";
import { GithubClient, GoogleClient, SpotifyClient } from "../oauth.secrets.js";

const generateAuthUri = (provider, scopes, providerName) => {
  const state = "";
  const client = new AuthorizationCode(provider);
  const authorizationUri = client.authorizeURL({
    redirect_uri: `http://localhost:3000/api/v1/users/auth/oauth/${providerName}/callback`,
    scope: scopes,
    state: state,
  });
  return authorizationUri;
};
const registerUserRedirectUri = (provider) => {
  let scopes;
  switch (provider) {
    case "google":
      scopes =
        "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";
      return generateAuthUri(GoogleClient, scopes, "google");
    case "facebook":
      scopes = ["email"];
      return generateAuthUri(FacebookClient, scopes, "facebook");
    case "github":
      scopes = ["user", "user:email"];
      return generateAuthUri(GithubClient, scopes, "github");
    case "microsoft":
      scopes = ["User.Read"];
      return generateAuthUri(MicrosoftClient, scopes, "microsoft");
    case "spotify":
      scopes = ["user-read-private", "user-read-email"];
      return generateAuthUri(SpotifyClient, scopes, "spotify");
    default:
      return undefined;
  }
};
export { registerUserRedirectUri };
