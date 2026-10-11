"use client";

import type { FC, PropsWithChildren } from "react";
import { useState } from "react";
import { PlayerContext } from "./PlayerContext";
import type { Options } from "./types";
import { usePlayerSetup } from "./use-player-setup";
import { useResumePlaybackPosition } from "./use-resume-playback-position";

export const PlayerProvider: FC<PropsWithChildren> = ({ children }) => {
  const [options, setOptions] = useState<Options | null>(null);

  const playerProps = usePlayerSetup(options);

  const { resumedFromPosition, startFromBeginning } = useResumePlaybackPosition(
    {
      player: playerProps.player,
      mediaKey: options?.mediaKey,
      canRestore: typeof options?.initialTime !== "number",
      sources: options?.sources,
    },
  );

  return (
    <PlayerContext.Provider
      value={{
        ...playerProps,
        options,
        setOptions,
        resumedFromPosition,
        startFromBeginning,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
