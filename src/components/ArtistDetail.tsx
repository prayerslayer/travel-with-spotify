import * as React from "react";
import styled from "styled-components";
import { ArtistWithTracks } from "../spotify";
import { Heading } from "./Layout";

const GridInlay = styled.section`
  grid-column: 1 / span 4;
  grid-row: ${props => props.top + 1};
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

const ArtistDetail: React.FunctionComponent<{
  artist: ArtistWithTracks;
  index: number;
}> = function({ artist, index }) {
  if (index === -1) {
    return null;
  }
  const followerCount = new Intl.NumberFormat().format(
    artist.artist.followers.total
  );
  const rowIndex = index % 4;
  const colIndex = Math.floor(index / 4);
  return (
    <GridInlay top={colIndex + 1} left={rowIndex * (180 + 10) + (180 / 2 - 15)}>
      <DisplayFont>{artist.artist.name}</DisplayFont>
      <Heading>{followerCount} followers</Heading>
      <BadgeContainer>
        {artist.artist.genres.map((genre, i) => (
          <Badge key={genre}>{genre}</Badge>
        ))}
      </BadgeContainer>
    </GridInlay>
  );
};
export default ArtistDetail;
