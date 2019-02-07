import * as React from "react";
import { Provider, Request } from "oauth2-client-js";
import { getMe, loggedIn } from "../api";
import { User } from "../spotify";
import { CenteredInPage, LargeButton } from "./Layout";

type LoginProps = {
  token: string | null;
  setToken: (token: string) => void;
  setMe: (me: User) => void;
};

export default class Login extends React.Component<LoginProps> {
  async componentDidMount() {
    try {
      const spotify = new Provider({
        id: "spotify",
        authorization_url: "https://accounts.spotify.com/authorize"
      });

      spotify.parse(window.location.hash);
      const token = spotify.getAccessToken();
      this.props.setToken(token);
      this.props.setMe(await getMe({ token }));
    } catch (e) {
      // Do nothing
    }
  }

  login = () => {
    const spotify = new Provider({
      id: "spotify",
      authorization_url: "https://accounts.spotify.com/authorize"
    });
    const request = new Request({
      client_id: "96116ce1fa57471ba2edf02d66c6f6c4",
      redirect_uri: "http://localhost:1234",
      scope: ["playlist-modify-public"]
    });

    const uri = spotify.requestToken(request);
    spotify.remember(request);
    window.location.href = uri;
  };

  render() {
    return (
      <CenteredInPage>
        <main>
          <LargeButton onClick={this.login}>Login with Spotify</LargeButton>
        </main>
      </CenteredInPage>
    );
  }
}
