import * as React from "react";
import { ArtistWithTracks, Image } from "../spotify";
import LazyImage from "./LazyImage";

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
        filter: !includedInPlaylist ? "opacity(33%)" : undefined
      }}
      src={image && image.url}
      fallback={
        <div
          style={{
            background: "crimson",
            alignItems: "center",
            justifyContent: "center",
            display: "flex",
            color: "fff",
            width: 180,
            height: 180,
            filter: !includedInPlaylist ? "opacity(33%)" : undefined
          }}
        >
          {artist.artist.name}
        </div>
      }
      alt=""
    />
  );
};
export default ArtistCard;
