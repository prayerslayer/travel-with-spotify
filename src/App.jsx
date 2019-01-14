import React from "react";
import LocationPicker from "./LocationPicker";
import uniq from "lodash-es/uniqBy";
import {
  loggedIn,
  findArtist,
  getMe,
  createPlaylist,
  getTopTracks,
  addTracksToPlaylist
} from "./api";
import { Provider, Request } from "oauth2-client-js";

function getQueryBandsIn(locationURI) {
  return `SELECT ?Band, ?Name WHERE {
  # hometown
  # 0 hop
  {
    ?Band foaf:name ?Name .  
    ?Band a schema:MusicGroup .
    ?Band dbo:hometown <${locationURI}>
  }
  # 1 hop
  UNION {
    ?Band foaf:name ?Name .
    ?Band a schema:MusicGroup .
    ?Band dbo:hometown ?p1ht1 .
    ?p1ht1 dbo:isPartOf <${locationURI}>
  }
  # 2 hop
  UNION {
    ?Band foaf:name ?Name .
    ?Band a schema:MusicGroup .
    ?Band dbo:hometown ?p1ht2 .
    ?p1ht2 dbo:isPartOf ?p2ht2 .
    ?p2ht2 dbo:isPartOf <${locationURI}>
  }
  # birthplace
  # 0 hop
  UNION {
    ?Band foaf:name ?Name .
    ?Band a schema:MusicGroup .
    ?Band dbo:birthPlace <${locationURI}>
  }
  # 1 hop
  UNION {
    ?Band foaf:name ?Name .
    ?Band a schema:MusicGroup .
    ?Band dbo:birthPlace ?p1bp1 .
    ?p1bp1 dbo:isPartOf <${locationURI}>
  }
  # 2 hop
  UNION {
    ?Band foaf:name ?Name .
    ?Band a schema:MusicGroup .
    ?Band dbo:birthPlace ?p1bp2 .
    ?p1bp2 dbo:isPartOf ?p2bp2 .
    ?p2bp2 dbo:isPartOf <${locationURI}>
  }
}`;
}

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      token: null,
      me: null,
      bands: [],
      location: null
    };
  }

  async processBand(playlist, band) {
    try {
      const artist = await findArtist(band.name, { token: this.state.token });
      if (artist === null) {
        return;
      }
      const tracks = await getTopTracks(artist, { token: this.state.token });
      await addTracksToPlaylist(playlist, tracks, { token: this.state.token });
    } finally {
      this.setState(state => ({
        bands: state.bands.map(b =>
          b.uri === band.uri ? { ...band, processed: true } : b
        )
      }));
    }
  }

  async startProcessing() {
    const playlist = await createPlaylist(this.state.me, this.state.location.name, {
      token: this.state.token
    });
    for (const band of this.state.bands) {
      await this.processBand(playlist, band);
    }
  }

  async componentDidMount() {
    const spotify = new Provider({
      id: "spotify",
      authorization_url: "https://accounts.spotify.com/authorize"
    });

    try {
      spotify.parse(window.location.hash);
      this.setState(
        {
          token: spotify.getAccessToken(),
          me: await getMe({ token: spotify.getAccessToken() })
        },
        () => {
          window.location.hash = "";
        }
      );
    } catch (e) {
      // Do login flow
      if (!(await loggedIn())) {
        var request = new Request({
          client_id: "96116ce1fa57471ba2edf02d66c6f6c4",
          redirect_uri: "http://localhost:1234",
          scope: ["playlist-modify-public"]
        });

        var uri = spotify.requestToken(request);
        spotify.remember(request);
        window.location.href = uri;
      }
    }
  }

  async handleLocation(location) {
    const bandQuery = getQueryBandsIn(location);
    const uri = `https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=${encodeURIComponent(
      bandQuery
    )}&format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query`;
    const resp = await fetch(uri);
    if (resp.ok) {
      const data = await resp.json();
      this.setState(
        {
          bands: uniq(
            data.results.bindings.map(b => ({
              name: b.Name.value,
              uri: b.Band.value,
              processed: false
            })),
            band => band.uri
          )
        },
        () => {
          this.startProcessing();
        }
      );
    }
  }

  render() {
    return (
      <div>
        <LocationPicker onSelect={this.handleLocation.bind(this)} />
        <ul>
          {this.state.bands.map(band => (
            <li
              style={{ color: band.processed ? "black" : "lightgray" }}
              key={band.uri}
            >
              {band.name}
            </li>
          ))}
        </ul>
      </div>
    );
  }
}
