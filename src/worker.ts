import "@babel/polyfill";
import { findArtist, getTopTracks, withRetry } from "./api";
import { ArtistWithTracks } from "./spotify";

const retryingFindArtist = withRetry(findArtist);
const retryingGetTopTracks = withRetry(getTopTracks);

onmessage = async function(e) {
  const { artistNames, token } = e.data;
  for (const artistName of artistNames) {
    const artist = await retryingFindArtist(artistName.artist.name, {
      token
    });
    if (artist === null) {
      postMessage(artistName);
      continue;
    }

    const tracks = await retryingGetTopTracks(artist, { token });
    const artistWithTracks: ArtistWithTracks = {
      artist,
      tracks
    };
    postMessage(artistWithTracks);
  }
};
