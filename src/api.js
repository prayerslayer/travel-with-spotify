import sortBy from "lodash-es/sortBy";

export async function loggedIn(opts) {
  const me = await getMe(opts);
  return !me.error;
}

export async function getMe({ token }) {
  const resp = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return await resp.json();
}

export async function findArtist(name, { token }) {
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

export async function getTopTracks(artist, { token }) {
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
  return (await resp.json()).tracks;
}

export async function addTracksToPlaylist(playlist, tracks, { token }) {
  await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      uris: tracks.map(track => track.uri)
    })
  });
}

export async function createPlaylist(user, name, { token }) {
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
