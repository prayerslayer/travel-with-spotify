import * as React from "react";
import LocationPicker from "./LocationPicker";
import uniq from "lodash-es/uniqBy";
import Login from './components/Login'
import {
  findArtist,
  createPlaylist,
  getTopTracks,
  addTracksToPlaylist
} from "./api";
import { Location } from "./sparql";
import { Playlist, Artist, Track, Image, User } from "./spotify";
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
  loadedFromSpotify: boolean;
}

type State = {
  minFollowers: number;
}

const RootContext = React.createContext({
  token: null,
  location: null,
  artists: [],
  me: null
})

type RootState = {
  token: string | null;
  setToken: (token: string) => void;
  me: null | User;
  setMe: (me: User) => void;
  artists: ArtistWithTracks[];
  setArtists: (artists: ArtistWithTracks[]) => void;
  location: null | Location;
  setLocation: (location: Location) => void;
}

export default class Root extends React.Component<{}, RootState>  {
  constructor(p) {
    super(p)
    this.state = {
      token: null,
      setToken: this.setToken,
      me: null,
      setMe: this.setMe,
      artists: [],
      setArtists: this.setArtists,
      location: null,
      setLocation: this.setLocation
    }
  }

  setToken = (token: string) => this.setState({ token })
  setLocation = (location: Location) => this.setState({ location })
  setArtists = (artists: ArtistWithTracks[]) => this.setState({ artists })
  setMe = (me: User) => this.setState({ me })

  render() {
    return <RootContext.Provider value={this.state}>
      <App
        {...this.state}
      />
    </RootContext.Provider>
  }
}

class App extends React.Component<RootState, State> {
  state = {
    minFollowers: 0,
  }

  async loadArtistFromSpotify(band: ArtistWithTracks) {
    const artist = await findArtist(band.data.name, { token: this.props.token });
    const idx = this.props.artists.findIndex(listArtist => listArtist.data.uri === band.data.uri)
    const newArtists = [...this.props.artists]
    newArtists.splice(idx, 1);
    if (artist === null) {
      this.props.setArtists(newArtists);
      return;
    }
    const tracks = await getTopTracks(artist, { token: this.props.token });
    newArtists.splice(idx, 0, { data: artist, tracks, loadedFromSpotify: true })
    this.props.setArtists(newArtists);
  }

  createPlaylist = async () => {
    return await createPlaylist(
      this.props.me,
      this.props.location.name,
      {
        token: this.props.token
      }
    )
  }

  async startLoadingArtistsFromSpotify() {
    // TODO needs to go in web worker
    for (const artist of this.props.artists) {
      await this.loadArtistFromSpotify(artist);
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
        band => band.uri).map((band: Artist) => ({ data: band, loadedFromSpotify: false, tracks: [] as Track[] }))
      this.props.setLocation(location)
      this.props.setArtists(artists)
      this.startLoadingArtistsFromSpotify()
    }
  }

  render() {
    const { artists, location, token } = this.props;
    const artistsToShow = artists.filter(artist => artist.loadedFromSpotify).filter(artist => artist.data.followers.total >= this.state.minFollowers)
    const estimatedPlaylistLengthSeconds = artistsToShow.reduce((sum, artist) => sum + artist.tracks.reduce((tracksum, track) => tracksum + track.duration_ms / 1000, 0), 0)
    if (token === null) {
      return <Login token={this.props.token} setMe={this.props.setMe} setToken={this.props.setToken} />
    }
    return (
      <div>
        <LocationPicker selectedLocation={location} onSelect={this.handleLocation.bind(this)} />
        {location !== null && (
          <section>
            <h1>{location.name}</h1>
            <p>{location.abstract}</p>
            <button onClick={() => this.startLoadingArtistsFromSpotify()}>
              Create playlist "{location.name}"
            </button>
            <button onClick={() => {
              this.props.setLocation(null);
              this.props.setArtists([])
              // TODO cancel ongoing work
            }}>Clear selection</button>
          </section>
        )}
        <h2>Artists ({artistsToShow.length})</h2>
        <input type="range" min={0} step={1000} value={this.state.minFollowers} max={Math.max(...artists.map(artist => artist.data.followers.total))} onChange={(e) => this.setState({ minFollowers: +e.target.value })}></input>
        <p>Estimated playlist length: {Math.floor(estimatedPlaylistLengthSeconds / 3600)} hours</p>
        <Grid>
          {Object.values(artistsToShow).map((artist: ArtistWithTracks) => (
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
    {image !== null ? <img style={{ objectFit: 'cover', width: 180, height: 180 }} src={image} alt="" /> : <div style={{ background: '#eee', width: 180, height: 180 }}>No image</div>}
    <h3>{artist.data.name}</h3>
    <ul>
      {artist.data.genres.map(genre => <li key={genre}>{genre}</li>)}
    </ul>
  </div>
}
