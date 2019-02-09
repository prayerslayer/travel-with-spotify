import * as React from "react";
import LocationPicker from "./LocationPicker";
import sortBy from "lodash-es/sortBy";
import Login from "./components/Login";
import {
  findArtist,
  getOrCreatePlaylist,
  getTopTracks,
  addTracksToPlaylist
} from "./api";
import { Location, getQueryBandsIn, getBandsFromLocation } from "./sparql";
import { Track, Image, User, ArtistWithTracks } from "./spotify";
import styled from "styled-components";
import { Heading, LargeInput, MediumButton } from "./components/Layout";
import LazyImage from "./components/LazyImage";

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
  padding: 10px 0px;
  width: 100%;
  text-align: center;

  &::before {
    content: "";
    display: block;
    position: relative;
    top: -20px;
    width: 0;
    height: 0;
    left: ${props => props.left}px;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 10px solid crimson;
  }
`;

type State = {
  playlistName: string;
  minPlaylistLengthHours: number;
  tracksPerArtist: number;
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

const PlaylistControlTable = styled.table`
  margin: 10px auto;
  padding: 25px;
  color: white;
  background: royalblue;
`;
type PlaylistCallback<K extends keyof State> = (s: Pick<State, K>) => void;
const PlaylistControls: React.FunctionComponent<
  State & {
    onChange: PlaylistCallback<any>;
    onCreate: PlaylistCallback<any>;
    onClear: () => void;
  }
> = function({
  onChange,
  onClear,
  onCreate,
  playlistName,
  tracksPerArtist,
  minPlaylistLengthHours
}) {
  return (
    <PlaylistControlTable>
      <tbody>
        <tr>
          <td>
            <label htmlFor="playlistname">Playlist Name</label>
          </td>
          <td>
            <LargeInput
              id="playlistname"
              type="text"
              value={playlistName}
              onChange={e => onChange({ playlistName: e.target.value })}
            />
          </td>
        </tr>
        <tr>
          <td>
            <label htmlFor="playlisttrackperartist">
              {tracksPerArtist} Tracks per Artist
            </label>
          </td>
          <td>
            <LargeInput
              type="range"
              min={1}
              max={10}
              step={1}
              onChange={e => onChange({ tracksPerArtist: +e.target.value })}
            />
          </td>
        </tr>
        <tr>
          <td>
            <label htmlFor="playlistlength">
              Desired playlist length (hours)
            </label>
          </td>
          <td>
            <LargeInput
              id="playlistlength"
              type="number"
              min={1}
              value={minPlaylistLengthHours}
              onChange={e =>
                onChange({
                  minPlaylistLengthHours: Math.max(1, +e.target.value)
                })
              }
            />
          </td>
        </tr>
        <tr>
          <td>
            <MediumButton
              onClick={() => {
                onClear();
              }}
            >
              Clear selection
            </MediumButton>
          </td>
          <td>
            <MediumButton
              onClick={() =>
                onCreate({
                  playlistName,
                  tracksPerArtist,
                  minPlaylistLengthHours
                })
              }
            >
              Create playlist
            </MediumButton>
          </td>
        </tr>
      </tbody>
    </PlaylistControlTable>
  );
};

const Progress = function({ percent, hideWhenFinished = true }) {
  if (percent >= 1 && hideWhenFinished) {
    return null;
  }
  const cutoff = percent * 100;
  const remaining = (100 - cutoff) / 2; // left and right
  return (
    <div
      style={{
        height: 25,
        color: "white",
        padding: 10,
        textAlign: "center",
        marginBottom: 25,
        backgroundImage: `linear-gradient(
          to right,
          transparent 0%,
          transparent ${remaining}%,
          crimson ${remaining}%,
          crimson ${remaining + cutoff}%,
          transparent ${remaining + cutoff}%)`
      }}
    >
      {Math.floor(cutoff)}%
    </div>
  );
};

class App extends React.Component<RootState, State> {
  state = {
    playlistName: "",
    minPlaylistLengthHours: 5,
    tracksPerArtist: 10
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

  createPlaylist = async (
    name: string,
    artists: ArtistWithTracks[],
    tracksPerArtist: number
  ) => {
    const playlist = await getOrCreatePlaylist(this.props.me, name, {
      token: this.props.token
    });
    const tracks: Track[] = [];
    for (const artist of artists) {
      tracks.push(...artist.tracks.slice(0, tracksPerArtist));
    }
    await addTracksToPlaylist(playlist, tracks, {
      token: this.props.token
    });
  };

  async startLoadingArtistsFromSpotify() {
    for (const artist of this.props.artists) {
      await this.loadArtistFromSpotify(artist);
    }
  }

  async handleLocation(location: Location) {
    const artists = await getBandsFromLocation(location);
    this.props.setLocation(location);
    this.setState({
      playlistName: location.name
    });
    this.props.setArtists(artists);
    this.startLoadingArtistsFromSpotify();
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
      currentPlaylistLengthSeconds += artistsByPopularity[i].tracks
        .slice(0, this.state.tracksPerArtist)
        .reduce((s, track) => s + track.duration_ms / 1000, 0);
      i++;
    }
    return i - 1;
  };

  render() {
    const { artists, location, token } = this.props;
    const loadedArtists = artists.filter(artist => artist.loadedFromSpotify);
    const artistsByPopularity = sortBy<ArtistWithTracks>(
      loadedArtists,
      artist => -artist.data.popularity
    ).slice(0, 400);
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
        {location === null && (
          <LocationPicker
            selectedLocation={location}
            onSelect={this.handleLocation.bind(this)}
          />
        )}
        {this.props.location !== null && (
          <PlaylistControls
            {...this.state}
            onChange={s => {
              this.setState(s);
            }}
            onClear={() => {
              this.props.setLocation(null);
              this.props.setArtists([]);
              // TODO cancel ongoing work
            }}
            onCreate={({ playlistName, tracksPerArtist }) => {
              this.createPlaylist(
                playlistName,
                artistsByPopularity.slice(0, indexOfLastIncludedArtist + 1),
                tracksPerArtist
              );
            }}
          />
        )}
        {/* artists */}
        {this.props.location !== null && (
          <React.Fragment>
            <Progress percent={loadedArtists.length / artists.length} />
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

const ArtistDetail: React.SFC<{
  artist: ArtistWithTracks;
  index: number;
}> = function({ artist, index }) {
  const followerCount = new Intl.NumberFormat().format(
    artist.data.followers.total
  );
  const indexInRow = index % 4;
  return (
    <GridInlay left={indexInRow * (180 + 10) + (180 / 2 - 15)}>
      <DisplayFont>{artist.data.name}</DisplayFont>
      <Heading>{followerCount} followers</Heading>
      <BadgeContainer>
        {artist.data.genres.map((genre, i) => (
          <Badge key={genre}>{genre}</Badge>
        ))}
      </BadgeContainer>
    </GridInlay>
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
        <ArtistDetail index={showDetailFor} artist={artists[showDetailFor]} />
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
  const image: Image | null =
    artist.data.images.length > 0 ? artist.data.images[0] : null;
  return (
    <div onClick={() => onClick()} title={artist.data.name}>
      <LazyImage
        width={180}
        height={180}
        style={{
          objectFit: "cover",
          filter: !includedInPlaylist ? "opacity(33%)" : undefined
        }}
        src={image && image.url}
        placeholder={
          <div
            style={{
              background: "crimson",
              alignItems: "center",
              justifyContent: "center",
              display: "flex",
              color: "fff",
              width: 180,
              height: 180,
              filter: !includedInPlaylist ? "opacity(33%)" : undefined
            }}
          >
            {artist.data.name}
          </div>
        }
        alt=""
      />
    </div>
  );
};
