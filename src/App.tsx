import * as React from "react";
import LocationPicker from "./LocationPicker";
import uniq from "lodash-es/uniqBy";
import partition from "lodash-es/partition";
import sortBy from "lodash-es/sortBy";
import Login from "./components/Login";
import {
  findArtist,
  getOrCreatePlaylist,
  getTopTracks,
  addTracksToPlaylist
} from "./api";
import { Location } from "./sparql";
import { Playlist, Artist, Track, Image, User } from "./spotify";
import styled from "styled-components";

const Grid = styled.section`
  display: grid;
  grid-template-columns: repeat(4, 180px);
  grid-gap: 10px 10px;
  justify-items: center;
  justify-content: center;
  align-items: start;
  align-content: center;
`;

const FullGridRow = styled.div`
  grid-column: 1 / span 4;
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
};

type State = {
  playlistName: string;
  minPlaylistLengthHours: number;
};

const RootContext = React.createContext({
  token: null,
  location: null,
  artists: [],
  me: null
});

type RootState = {
  token: string | null;
  setToken: (token: string) => void;
  me: null | User;
  setMe: (me: User) => void;
  artists: ArtistWithTracks[];
  setArtists: (artists: ArtistWithTracks[]) => void;
  location: null | Location;
  setLocation: (location: Location) => void;
};

export default class Root extends React.Component<{}, RootState> {
  constructor(p) {
    super(p);
    this.state = {
      token: null,
      setToken: this.setToken,
      me: null,
      setMe: this.setMe,
      artists: [],
      setArtists: this.setArtists,
      location: null,
      setLocation: this.setLocation
    };
  }

  setToken = (token: string) => this.setState({ token });
  setLocation = (location: Location) => this.setState({ location });
  setArtists = (artists: ArtistWithTracks[]) => this.setState({ artists });
  setMe = (me: User) => this.setState({ me });

  render() {
    return (
      <RootContext.Provider value={this.state}>
        <App {...this.state} />
      </RootContext.Provider>
    );
  }
}

class App extends React.Component<RootState, State> {
  state = {
    playlistName: "",
    minPlaylistLengthHours: 5
  };

  async loadArtistFromSpotify(band: ArtistWithTracks) {
    const idx = this.props.artists.findIndex(
      listArtist => listArtist.data.uri === band.data.uri
    );
    const newArtists = [...this.props.artists];
    newArtists.splice(idx, 1);

    const artist = await findArtist(band.data.name, {
      token: this.props.token
    });
    if (artist === null) {
      this.props.setArtists(newArtists);
      return;
    }

    const tracks = await getTopTracks(artist, { token: this.props.token });
    if (tracks.length > 0) {
      newArtists.splice(idx, 0, {
        data: artist,
        tracks,
        loadedFromSpotify: true
      });
    }

    this.props.setArtists(newArtists);
  }

  createPlaylist = async (name: string, artists: ArtistWithTracks[]) => {
    const playlist = await getOrCreatePlaylist(this.props.me, name, {
      token: this.props.token
    });
    for (const artist of artists) {
      await addTracksToPlaylist(playlist, artist.tracks, {
        token: this.props.token
      });
    }
  };

  async startLoadingArtistsFromSpotify() {
    for (const artist of this.props.artists) {
      await this.loadArtistFromSpotify(artist);
    }
  }

  async handleLocation(location: Location) {
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
        band => band.uri
      ).map((band: Artist) => ({
        data: band,
        loadedFromSpotify: false,
        tracks: [] as Track[]
      }));
      this.props.setLocation(location);
      this.setState({
        playlistName: location.name
      });
      this.props.setArtists(artists);
      this.startLoadingArtistsFromSpotify();
    }
  }

  partitionArtists: (artistsByPopularity: ArtistWithTracks[]) => number = (
    artistsByPopularity: ArtistWithTracks[]
  ) => {
    let currentPlaylistLengthSeconds = 0;
    let i = 0;

    while (
      i < artistsByPopularity.length &&
      currentPlaylistLengthSeconds <
        Math.round(this.state.minPlaylistLengthHours * 3600)
    ) {
      currentPlaylistLengthSeconds += artistsByPopularity[i].tracks.reduce(
        (s, track) => s + track.duration_ms / 1000,
        0
      );
      i++;
    }
    return i - 1;
  };

  render() {
    const { artists, location, token } = this.props;
    const artistsByPopularity = sortBy<ArtistWithTracks>(
      artists.filter(artist => artist.loadedFromSpotify),
      artist => -artist.data.popularity
    );
    const indexOfLastIncludedArtist = this.partitionArtists(
      artistsByPopularity
    );

    if (token === null) {
      return (
        <Login
          token={this.props.token}
          setMe={this.props.setMe}
          setToken={this.props.setToken}
        />
      );
    }
    return (
      <div>
        <LocationPicker
          selectedLocation={location}
          onSelect={this.handleLocation.bind(this)}
        />
        {location !== null && (
          <section>
            <h1>{location.name}</h1>
            <p>{location.abstract}</p>
            <button
              onClick={() => {
                this.props.setLocation(null);
                this.props.setArtists([]);
                // TODO cancel ongoing work
              }}
            >
              Clear selection
            </button>
          </section>
        )}
        {this.props.location !== null && (
          <React.Fragment>
            <h2>Artists ({artists.length})</h2>
            <section>
              <div>
                <label htmlFor="playlistname">Playlist Name</label>
                <input
                  id="playlistname"
                  type="text"
                  value={this.state.playlistName}
                  onChange={e =>
                    this.setState({ playlistName: e.target.value })
                  }
                />
              </div>
              <div>
                <label htmlFor="playlistlength">
                  Desired playlist length (hours)
                </label>
                <input
                  id="playlistlength"
                  type="number"
                  min={1}
                  value={this.state.minPlaylistLengthHours}
                  onChange={e =>
                    this.setState({
                      minPlaylistLengthHours: Math.max(1, +e.target.value)
                    })
                  }
                />
              </div>
              <div>
                <button
                  onClick={() =>
                    this.createPlaylist(
                      this.state.playlistName,
                      artistsByPopularity.slice(
                        0,
                        indexOfLastIncludedArtist + 1
                      )
                    )
                  }
                >
                  Create playlist "{this.state.playlistName}"
                </button>
              </div>
            </section>
            <ArtistGrid
              artists={artistsByPopularity}
              indexOfLastIncludedArtist={indexOfLastIncludedArtist}
            />
          </React.Fragment>
        )}
      </div>
    );
  }
}

const ArtistGrid: React.SFC<{
  artists: ArtistWithTracks[];
  indexOfLastIncludedArtist: number;
}> = function({ artists, indexOfLastIncludedArtist }) {
  const [
    showDetailForArtistWithIndex,
    setShowDetailForArtistWithIndex
  ] = React.useState(-1);
  let artistsBefore = artists;
  let artistsAfter = [];
  if (showDetailForArtistWithIndex >= 0) {
    let quotient = Math.floor(showDetailForArtistWithIndex / 4);
    let remainder = showDetailForArtistWithIndex % 4;
    let pivot = (quotient + 1) * 4;
    artistsBefore = artists.slice(0, pivot);
    artistsAfter = artists.slice(pivot);
  }
  return (
    <Grid>
      {artistsBefore.map((artist, i) => (
        <ArtistCard
          onClick={() =>
            i !== showDetailForArtistWithIndex
              ? setShowDetailForArtistWithIndex(i)
              : -1
          }
          key={artist.data.uri}
          includedInPlaylist={i <= indexOfLastIncludedArtist}
          artist={artist}
        />
      ))}
      {showDetailForArtistWithIndex >= 0 && (
        <FullGridRow>
          <h3>{artists[showDetailForArtistWithIndex].data.name}</h3>
          <ul>
            {artists[showDetailForArtistWithIndex].data.genres.map(genre => (
              <li key={genre}>{genre}</li>
            ))}
          </ul>
        </FullGridRow>
      )}
      {artistsAfter.map((artist, i) => (
        <ArtistCard
          onClick={() =>
            i - 1 !== showDetailForArtistWithIndex
              ? setShowDetailForArtistWithIndex(i - 1)
              : -1
          }
          key={artist.data.uri}
          includedInPlaylist={i <= indexOfLastIncludedArtist}
          artist={artist}
        />
      ))}
    </Grid>
  );
};

type ArtistCardProps = {
  artist: ArtistWithTracks;
  includedInPlaylist: boolean;
  onClick: () => void;
};
const ArtistCard: React.SFC<ArtistCardProps> = function({
  artist,
  onClick,
  includedInPlaylist
}) {
  const image: string | null =
    artist.data.images.length > 0 ? artist.data.images[0].url : null;
  return (
    <div
      onClick={() => onClick()}
      title={artist.data.name}
      style={{ filter: !includedInPlaylist ? "opacity(33%)" : undefined }}
    >
      {image !== null ? (
        <img
          style={{ objectFit: "cover", width: 180, height: 180 }}
          src={image}
          alt=""
        />
      ) : (
        <div
          style={{ background: "#fef", color: "fff", width: 180, height: 180 }}
        >
          {artist.data.name}
        </div>
      )}
    </div>
  );
};
