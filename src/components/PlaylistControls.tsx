import * as React from "react";
import styled from "styled-components";
import { LargeInput, MediumButton, MediumPrimaryButton } from "./Layout";

const PlaylistControlTable = styled.table`
  margin: 10px auto;
  padding: 25px;
  color: white;
  background: royalblue;
`;
type Props = {
  playlistName: string;
  tracksPerArtist: number;
  minPlaylistLengthHours: number;
  onChange: PlaylistCallback<any>;
  onCreate: () => void;
  onClear: () => void;
};
type PlaylistCallback<K extends keyof Props> = (s: Pick<Props, K>) => void;
const PlaylistControls: React.FunctionComponent<Props> = function({
  onChange,
  onClear,
  onCreate,
  playlistName,
  tracksPerArtist,
  minPlaylistLengthHours
}) {
  return (
    <PlaylistControlTable>
      <tbody>
        <tr>
          <td>
            <label htmlFor="playlistname">Playlist Name</label>
          </td>
          <td>
            <LargeInput
              id="playlistname"
              type="text"
              value={playlistName}
              onChange={e => onChange({ playlistName: e.target.value })}
            />
          </td>
        </tr>
        <tr>
          <td>
            <label htmlFor="playlisttrackperartist">
              {tracksPerArtist} Tracks per Artist
            </label>
          </td>
          <td>
            <LargeInput
              type="range"
              min={1}
              max={10}
              step={1}
              value={tracksPerArtist}
              onChange={e => onChange({ tracksPerArtist: +e.target.value })}
            />
          </td>
        </tr>
        <tr>
          <td>
            <label htmlFor="playlistlength">
              Desired playlist length (hours)
            </label>
          </td>
          <td>
            <LargeInput
              id="playlistlength"
              type="number"
              min={1}
              value={minPlaylistLengthHours}
              onChange={e =>
                onChange({
                  minPlaylistLengthHours: Math.max(1, +e.target.value)
                })
              }
            />
          </td>
        </tr>
        <tr>
          <td>
            <MediumButton
              onClick={() => {
                onClear();
              }}
            >
              Close
            </MediumButton>
          </td>
          <td>
            <MediumPrimaryButton onClick={() => onCreate()}>
              Create playlist
            </MediumPrimaryButton>
          </td>
        </tr>
      </tbody>
    </PlaylistControlTable>
  );
};
export default PlaylistControls;
