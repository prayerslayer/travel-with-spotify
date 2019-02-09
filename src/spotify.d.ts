// collaborative: false
// external_urls: {spotify: "https://open.spotify.com/playlist/0D8qFlbBxbJcEYzYD2Fhd5"}
// href: "https://api.spotify.com/v1/playlists/0D8qFlbBxbJcEYzYD2Fhd5"
// id: "0D8qFlbBxbJcEYzYD2Fhd5"
// images: [{height: 640,…}, {height: 300,…}, {height: 60,…}]
// name: "Austria"
// owner: {display_name: "prayerslayer", external_urls: {spotify: "https://open.spotify.com/user/prayerslayer"},…}
// primary_color: null
// public: true
// snapshot_id: "MTIzLGUyYzMwYzczMWZiZDMxYWZiOTc1MmRlOTQyOGFkNGFiNTUzNzRlMGE="
// tracks: {href: "https://api.spotify.com/v1/playlists/0D8qFlbBxbJcEYzYD2Fhd5/tracks", total: 1160}
// type: "playlist"
// uri: "spotify:user:prayerslaye

export type Playlist = {};

// display_name: "prayerslayer"
// external_urls: {spotify: "https://open.spotify.com/user/prayerslayer"}
// followers: {href: null, total: 9}
// href: "https://api.spotify.com/v1/users/prayerslayer"
// id: "prayerslayer"
// images: [{height: null,…}]
// type: "user"
// uri: "spotify:user:prayerslayer"

export type User = {
  id: string;
  type: "user";
  uri: string;
};

type Image = {
  width: number;
  height: number;
  url: string;
};

// external_urls: {spotify: "https://open.spotify.com/artist/3pxUWacRT5JtY6FwvwaylQ"}
// followers: {href: null, total: 182}
// genres: ["vienna indie"]
// href: "https://api.spotify.com/v1/artists/3pxUWacRT5JtY6FwvwaylQ"
// id: "3pxUWacRT5JtY6FwvwaylQ"
// images: [{height: 640, url: "https://i.scdn.co/image/958a7d869871516542eac55c489ec55d6e62ee31", width: 640},…]
// name: "Excuse Me Moses"
// popularity: 4
// type: "artist"
// uri: "spotify:artist:

export type Artist = {
  name: string;
  type: "artist";
  uri: string;
  id: string;
  genres: string[];
  images: Image[];
  popularity: number;
  followers: { total: number };
};

export type ArtistWithTracks = {
  data: Artist;
  tracks: Track[];
  loadedFromSpotify: boolean;
};

// album: {album_type: "album",…}
// artists: [{external_urls: {spotify: "https://open.spotify.com/artist/3pxUWacRT5JtY6FwvwaylQ"},…}]
// disc_number: 1
// duration_ms: 214386
// explicit: false
// external_ids: {isrc: "ATUM70700176"}
// external_urls: {spotify: "https://open.spotify.com/track/0BzHbtiwVbJlzzoPUKiXET"}
// href: "https://api.spotify.com/v1/tracks/0BzHbtiwVbJlzzoPUKiXET"
// id: "0BzHbtiwVbJlzzoPUKiXET"
// is_local: false
// is_playable: true
// name: "Butterfly Tree"
// popularity: 6
// preview_url: "https://p.scdn.co/mp3-preview/3b1b120054a259e979862fa8f953228324627c3e?cid=96116ce1fa57471ba2edf02d66c6f6c4"
// track_number: 3
// type: "track"
// uri: "spotify:track:0BzHbtiwVbJl

export type Track = {
  uri: string;
  type: "track";
  id: string;
  name: string;
  duration_ms: number;
};

export type PagedResult<Content> = {
  href: string;
  limit: number;
  next: null | string;
  offset: number;
  previous: null | string;
  total: number;
  items: Content[];
};
