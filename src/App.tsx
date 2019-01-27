import * as React from "react";
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
import { Location } from "./graphql";
import { Playlist, Artist, Track, Image } from "./spotify";
import styled from 'styled-components'

const Grid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fill, 180px);
  grid-gap: 10px 10px;
  justify-items: center;
  justify-content: center;
  align-items: start;
  align-content: center;
`;


function getQueryBandsIn(locationURI: string) {
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

type ArtistWithTracks = {
  data: Artist;
  tracks: Track[];
}

type State = {
  token: string | null;
  me: null | any;
  artists: ArtistWithTracks[];
  estimatedPlaylistLengthSeconds: number;
  location: null | Location;
}

export default class App extends React.Component<{}, State> {
  state = {
    token: null,
    me: null,
    artists: [],
    estimatedPlaylistLengthSeconds: 0,
    location: null
  }

  async loadArtistFromSpotify(band: ArtistWithTracks) {
    const bandIndex = this.state.artists.indexOf(band)
    const artist = await findArtist(band.data.name, { token: this.state.token });
    if (artist === null) {
      return;
    }
    const tracks = await getTopTracks(artist, { token: this.state.token });
    this.setState(state => ({
      estimatedPlaylistLengthSeconds: tracks.reduce((sum: number, track) => track.duration_ms / 1000 + sum, state.estimatedPlaylistLengthSeconds),
      artists: [{ data: artist, tracks }, ...state.artists] // TODO duplication
    }))
  }

  createPlaylist = async () => {
    return await createPlaylist(
      this.state.me,
      this.state.location.name,
      {
        token: this.state.token
      }
    )
  }

  async startLoadingArtistsFromSpotify() {
    for (const artist of this.state.artists) {
      await this.loadArtistFromSpotify(artist);
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
      if (!(await loggedIn({ token: this.state.token }))) {
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
    const bandQuery = getQueryBandsIn(location.uri);
    const uri = `https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=${encodeURIComponent(
      bandQuery
    )}&format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query`;
    const resp = await fetch(uri);
    if (resp.ok) {
      const data = await resp.json();
      const artists: ArtistWithTracks[] = uniq<Artist>(
        data.results.bindings.map(b => ({
          name: b.Name.value,
          uri: b.Band.value,
          images: [],
          genres: [],
          popularity: 0,
          followers: { total: 0 }
        })),
        band => band.uri).map((band: Artist) => ({ data: band, tracks: [] as Track[] }))
      this.setState({
        location,
        artists
      });
      this.startLoadingArtistsFromSpotify()
    }
  }

  render() {
    const { artists, location } = this.state;
    return (
      <div>
        <LocationPicker onSelect={this.handleLocation.bind(this)} />
        {location !== null && (
          <section>
            <h1>{location.name}</h1>
            <p>{location.abstract}</p>
            <button onClick={() => this.startLoadingArtistsFromSpotify()}>
              Create playlist "{location.name}"
            </button>
          </section>
        )}
        <h2>Artists ({this.state.artists.length})</h2>
        <p>Estimated playlist length: {Math.floor(this.state.estimatedPlaylistLengthSeconds / 3600)} hours</p>
        <Grid>
          {Object.values(artists).map((artist: ArtistWithTracks) => (
            <ArtistCard
              key={artist.data.uri}
              artist={artist}
            />
          ))}
        </Grid>
      </div>
    );
  }
}

const ArtistCard: React.SFC<{ artist: ArtistWithTracks }> = function ({ artist }) {
  const image: string | null = artist.data.images.length > 0 ? artist.data.images[0].url : null;
  return <div>
    {image !== null ? <img style={{ objectFit: 'cover', width: 180, height: 180 }} src={image} alt="" /> : <div style={{ background: '#eee', width: 180, height: 180 }} />}
    <h3>{artist.data.name}</h3>
    {artist.data.genres.map(genre => <span key={genre}>{genre}</span>)}
  </div>
}
