import { ArtistWithTracks } from "../spotify";
import * as React from "react";
import ArtistCard from "./ArtistCard";
import ArtistDetail from "./ArtistDetail";
import { Grid } from "./Layout";

const ArtistGrid: React.FunctionComponent<{
  artists: ArtistWithTracks[];
  indexOfLastIncludedArtist: number;
}> = function({ artists, indexOfLastIncludedArtist }) {
  const [showDetailFor, setShowDetailFor] = React.useState(-1);

  return (
    <Grid>
      {artists.map((artist, i) => (
        <ArtistCard
          onClick={() => setShowDetailFor(i !== showDetailFor ? i : -1)}
          key={artist.artist.id}
          includedInPlaylist={i <= indexOfLastIncludedArtist}
          artist={artist}
        />
      ))}
      <ArtistDetail index={showDetailFor} artist={artists[showDetailFor]} />
    </Grid>
  );
};

export default ArtistGrid;
