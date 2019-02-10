import * as React from "react";
import { ArtistWithTracks, Image } from "../spotify";
import LazyImage from "./LazyImage";
import styled from "styled-components";

const ArtistCardNoImage = styled.div`
  background: crimson;
  color: #fff;
  align-items: center;
  justify-content: center;
  display: flex;
  cursor: pointer;
  width: 180;
  height: 180;
`;

type ArtistCardProps = {
  artist: ArtistWithTracks;
  includedInPlaylist: boolean;
  onClick: () => void;
};
const ArtistCard: React.FunctionComponent<ArtistCardProps> = function({
  artist,
  onClick,
  includedInPlaylist
}) {
  const image: Image | null =
    artist.artist.images.length > 0 ? artist.artist.images[0] : null;
  return (
    <LazyImage
      width={180}
      height={180}
      onClick={() => onClick()}
      style={{
        objectFit: "cover",
        cursor: "pointer",
        filter: !includedInPlaylist ? "opacity(33%)" : undefined
      }}
      src={image && image.url}
      fallback={
        <ArtistCardNoImage
          onClick={() => onClick()}
          style={{
            filter: !includedInPlaylist ? "opacity(33%)" : undefined
          }}
        >
          {artist.artist.name}
        </ArtistCardNoImage>
      }
      alt=""
    />
  );
};
export default ArtistCard;
