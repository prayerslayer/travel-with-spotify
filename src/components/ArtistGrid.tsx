import { ArtistWithTracks } from "../spotify";
import styled from "styled-components";
import * as React from "react";
import ArtistCard from "./ArtistCard";
import ArtistDetail from "./ArtistDetail";

const Grid = styled.section`
  display: grid;
  grid-template-columns: repeat(4, 180px);
  grid-gap: 10px 10px;
  justify-items: center;
  justify-content: center;
  align-items: start;
  align-content: center;
`;

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
          key={artist.artist.uri}
          includedInPlaylist={i <= indexOfLastIncludedArtist}
          artist={artist}
        />
      ))}
      <ArtistDetail index={showDetailFor} artist={artists[showDetailFor]} />
    </Grid>
  );
};

export default ArtistGrid;
