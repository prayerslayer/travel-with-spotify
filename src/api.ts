import sortBy from "lodash-es/sortBy";
import { User, Artist, Playlist, Track } from "./spotify";
import chunk from "lodash-es/chunk";

type APIOptions = {
  token: string;
};

export class APIError extends Error {
  response: Response = null;

  constructor(response: Response) {
    super(response.statusText);
    this.response = response;
  }
}

function sleep(seconds: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => resolve(), seconds);
  });
}

export function withRetry(fn) {
  return async function wrappedFn(...args) {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof APIError) {
        if (e.response.status === 429) {
          const waitSeconds = +e.response.headers.get("Retry-After");
          await sleep(waitSeconds);
          return await wrappedFn(...args);
        }
      }
    }
  };
}

export async function loggedIn(opts: APIOptions): Promise<boolean> {
  const me = await getMe(opts);
  return !(me as any).error;
}

export async function getMe({ token }: APIOptions): Promise<User> {
  const resp = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return await resp.json();
}

export async function findArtist(
  name: string,
  { token }: APIOptions
): Promise<Artist | null> {
  const resp = await fetch(
    `https://api.spotify.com/v1/search?type=artist&q=${encodeURIComponent(
      name
    )}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  if (!resp.ok) {
    throw new APIError(resp);
  }
  const artists = (await resp.json()).artists.items;
  const maybe = sortBy(
    artists.filter(artist => artist.name === name),
    "-popularity"
  );
  if (maybe.length > 0) {
    return maybe[0];
  }
  return null;
}

export async function getTopTracks(
  artist: Artist,
  { token }: APIOptions
): Promise<Track[]> {
  const resp = await fetch(
    `https://api.spotify.com/v1/artists/${
      artist.id
    }/top-tracks?market=from_token`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  if (!resp.ok) {
    throw new APIError(resp);
  }
  return (await resp.json()).tracks;
}

export async function addTracksToPlaylist(
  playlist: Playlist,
  tracks: Track[],
  { token }: APIOptions
): Promise<void> {
  const trackChunks = chunk(tracks, 100);
  for (const trackChunk of trackChunks) {
    await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        uris: trackChunk.map(track => track.uri)
      })
    });
  }
}

export async function getOrCreatePlaylist(
  user: User,
  name: string,
  { token }: APIOptions
): Promise<Playlist> {
  // First check if one exists
  let resp = await fetch(
    `https://api.spotify.com/v1/users/${user.id}/playlists`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  const lists = (await resp.json()).items;
  const existingList = lists.find(list => list.name === name);
  if (existingList) {
    return existingList;
  }

  resp = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name
    })
  });
  return await resp.json();
}
