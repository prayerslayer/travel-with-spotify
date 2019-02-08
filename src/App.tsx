import * as React from "react";
import LocationPicker, { LocationCard, LargeLocation } from "./LocationPicker";
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
import { Location, getQueryBandsIn } from "./sparql";
import { Playlist, Artist, Track, Image, User } from "./spotify";
import styled from "styled-components";
import { Button, Heading } from "./components/Layout";

const Grid = styled.section`
  display: grid;
  grid-template-columns: repeat(4, 180px);
  grid-gap: 10px 10px;
  justify-items: center;
  justify-content: center;
  align-items: start;
  align-content: center;
`;

const GridInlay = styled.section`
  grid-column: 1 / span 4;
  background: crimson;
  color: white;
  padding: 10px;
  width: 100%;
  text-align: center;
`;

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
            <LargeLocation location={location} />
            <Button
              onClick={() => {
                this.props.setLocation(null);
                this.props.setArtists([]);
                // TODO cancel ongoing work
              }}
            >
              Clear selection
            </Button>
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
                <Button
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
                </Button>
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

const DisplayFont = styled.div`
  font-size: 3rem;
  font-weight: lighter;
`;

const Badge = styled.span`
  border-radius: 15px;
  font-size: 0.75rem;
  padding: 5px 10px;
  margin: 2.5px;
  background: darkred;
  color: white;
  white-space: nowrap;
`;

const BadgeContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
`;

const ArtistDetail: React.SFC<{ artist: ArtistWithTracks }> = function({
  artist
}) {
  const followerCount = new Intl.NumberFormat().format(
    artist.data.followers.total
  );
  return (
    <React.Fragment>
      <DisplayFont>{artist.data.name}</DisplayFont>
      <Heading>{followerCount} followers</Heading>
      <BadgeContainer>
        {artist.data.genres.map((genre, i) => (
          <Badge key={genre}>{genre}</Badge>
        ))}
      </BadgeContainer>
    </React.Fragment>
  );
};

const ArtistGrid: React.SFC<{
  artists: ArtistWithTracks[];
  indexOfLastIncludedArtist: number;
}> = function({ artists, indexOfLastIncludedArtist }) {
  const [showDetailFor, setShowDetailFor] = React.useState(-1);
  let artistsBefore = artists;
  let artistsAfter = [];
  const showingDetail = showDetailFor >= 0;
  if (showingDetail) {
    let pivot = (Math.floor(showDetailFor / 4) + 1) * 4;
    artistsBefore = artists.slice(0, pivot);
    artistsAfter = artists.slice(pivot);
  }
  return (
    <Grid>
      {artistsBefore.map((artist, i) => (
        <ArtistCard
          onClick={() => setShowDetailFor(i !== showDetailFor ? i : -1)}
          key={artist.data.uri}
          selected={showDetailFor === i}
          includedInPlaylist={i <= indexOfLastIncludedArtist}
          artist={artist}
        />
      ))}
      {showingDetail && (
        <GridInlay>
          <ArtistDetail artist={artists[showDetailFor]} />
        </GridInlay>
      )}
      {artistsAfter.map((artist, i) => (
        <ArtistCard
          onClick={() =>
            setShowDetailFor(
              artistsBefore.length + i !== showDetailFor
                ? artistsBefore.length + i
                : -1
            )
          }
          selected={showDetailFor === artistsBefore.length + i}
          key={artist.data.uri}
          includedInPlaylist={
            artistsBefore.length + i <= indexOfLastIncludedArtist
          }
          artist={artist}
        />
      ))}
    </Grid>
  );
};

type ArtistCardProps = {
  artist: ArtistWithTracks;
  includedInPlaylist: boolean;
  selected: boolean;
  onClick: () => void;
};
const ArtistCard: React.SFC<ArtistCardProps> = function({
  artist,
  onClick,
  selected,
  includedInPlaylist
}) {
  const image: string | null =
    artist.data.images.length > 0 ? artist.data.images[0].url : null;
  return (
    <div
      onClick={() => onClick()}
      title={artist.data.name}
      style={{
        outline: selected ? "10px solid crimson" : undefined
      }}
    >
      {image !== null ? (
        <img
          style={{
            objectFit: "cover",
            width: 180,
            height: 180,
            filter: !includedInPlaylist ? "opacity(33%)" : undefined
          }}
          src={image}
          alt=""
        />
      ) : (
        <div
          style={{
            background: "#fef",
            color: "fff",
            width: 180,
            height: 180,
            filter: !includedInPlaylist ? "opacity(33%)" : undefined
          }}
        >
          {artist.data.name}
        </div>
      )}
    </div>
  );
};
