import * as React from "react";
import LocationPicker from "./LocationPicker";
import sortBy from "lodash-es/sortBy";
import Login from "./components/Login";
import { getOrCreatePlaylist, addTracksToPlaylist } from "./api";
import chunk from "lodash-es/chunk";
import { Location, getBandsFromLocation } from "./sparql";
import { Track, Image, User, ArtistWithTracks } from "./spotify";
import styled from "styled-components";
import { Heading, LargeInput, MediumButton } from "./components/Layout";
import LazyImage from "./components/LazyImage";
import ArtistGrid from "./components/ArtistGrid";
import PlaylistControls from "./components/PlaylistControls";

type State = {
  playlistName: string;
  minPlaylistLengthHours: number;
  tracksPerArtist: number;
  workers: Worker[];
  location: Location | null;

  artistNames: ArtistWithTracks[];
  fetchedArtistCount: number;
  artists: ArtistWithTracks[];
  token: string | null;
  me: User | null;
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

const INITIAL_STATE: State = {
  playlistName: "",
  minPlaylistLengthHours: 5,
  tracksPerArtist: 10,
  artistNames: [],
  fetchedArtistCount: 0,
  artists: [],
  token: null,
  location: null,
  me: null,
  workers: []
};

const hasIdleCallback =
  "requestIdleCallback" in window
    ? window.requestIdleCallback
    : window.setTimeout;
const deferFn = function(cb) {
  if (hasIdleCallback) {
    window.requestIdleCallback(cb);
  } else {
    window.setTimeout(cb, 0);
  }
};

export default class App extends React.Component<{}, State> {
  state = INITIAL_STATE;

  insertArtist = (artist: ArtistWithTracks) => {
    deferFn(() => {
      this.setState(state => {
        const newState = { ...state };
        newState.fetchedArtistCount += 1;
        const artistExists =
          newState.artists.findIndex(
            existingArtist => existingArtist.artist.uri === artist.artist.uri
          ) >= 0;
        if (!artistExists) {
          let firstLessPopularArtistIndex = newState.artists.findIndex(
            listArtist =>
              artist.artist.popularity > listArtist.artist.popularity
          );
          if (firstLessPopularArtistIndex === -1) {
            firstLessPopularArtistIndex = newState.artists.length;
          }
          newState.artists.splice(firstLessPopularArtistIndex, 0, artist);
        }
        return newState;
      });
    });
  };

  createPlaylist = async (
    name: string,
    artists: ArtistWithTracks[],
    tracksPerArtist: number
  ) => {
    const playlist = await getOrCreatePlaylist(this.state.me, name, {
      token: this.state.token
    });
    const tracks: Track[] = [];
    for (const artist of artists) {
      tracks.push(...artist.tracks.slice(0, tracksPerArtist));
    }
    await addTracksToPlaylist(playlist, tracks, {
      token: this.state.token
    });
  };

  startLoadingArtistsFromSpotify = async () => {
    const chunks = chunk(this.state.artistNames, 500);
    console.log("Starting", chunks.length, "workers");
    for (const artistChunk of chunks) {
      const worker = new Worker("./worker.ts");
      this.setState(state => ({ workers: [...state.workers, worker] }));
      worker.onmessage = e => {
        this.insertArtist(e.data as ArtistWithTracks);
      };
      worker.postMessage({
        artistNames: artistChunk,
        token: this.state.token
      });
    }
  };

  handleLocation = async (location: Location) => {
    const artistNames = await getBandsFromLocation(location);
    this.setState(
      {
        location,
        artistNames,
        playlistName: location.name
      },
      () => this.startLoadingArtistsFromSpotify()
    );
  };

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
    const {
      artists,
      artistNames,
      fetchedArtistCount: processedArtists,
      location,
      token
    } = this.state;
    const indexOfLastIncludedArtist = this.partitionArtists(artists);

    if (token === null) {
      return (
        <Login
          token={this.state.token}
          onLogin={(me, token) => {
            this.setState({ me, token });
          }}
        />
      );
    }
    return (
      <div>
        {location === null ? (
          <LocationPicker
            selectedLocation={location}
            onSelect={this.handleLocation}
          />
        ) : (
          <React.Fragment>
            <PlaylistControls
              {...this.state}
              onChange={s => {
                this.setState(s);
              }}
              onClear={() => {
                for (const worker of this.state.workers) {
                  worker.terminate();
                }
                this.setState({
                  ...INITIAL_STATE,
                  me: this.state.me,
                  token: this.state.token
                });
              }}
              onCreate={() => {
                this.createPlaylist(
                  this.state.playlistName,
                  artists.slice(0, indexOfLastIncludedArtist + 1),
                  this.state.tracksPerArtist
                );
              }}
            />

            <Progress percent={processedArtists / artistNames.length} />
            <ArtistGrid
              artists={artists}
              indexOfLastIncludedArtist={indexOfLastIncludedArtist}
            />
          </React.Fragment>
        )}
      </div>
    );
  }
}
