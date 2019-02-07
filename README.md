# Travel with Spotify

Takes a Wikipedia page of a place. Creates a Spotify playlist from artists with a connection to that place. If a playlist with the desired name already exists, they will be added to that one.

## TODO

- Make proper cancel button
- Make loading indicator
- Make a bit more beautiful
- Deploy somewhere (zeit.sh? github pages?)
- Actual location search input? Possibly with a map :OOOOO

## Develop

- `npm install`
- `npm run dev`

The app never saves state anywhere, means it does the OAuth2 redirect all the time.
