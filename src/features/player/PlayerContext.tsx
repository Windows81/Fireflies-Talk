"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ContextValue, Source } from "./types";

export const PlayerContext = createContext({} as ContextValue);

export const usePlayer = () => {
  const { player, setOptions } = useContext(PlayerContext);
  return { setOptions, player };
};

export const useResumePlayback = () => {
  const { resumedFromPosition, startFromBeginning } = useContext(PlayerContext);
  return { resumedFromPosition, startFromBeginning };
};

/**
 * States derived from the player
 * This is calculated locally instead of stored in the context
 * due to the frequency of updates (esp. currentTime)
 */
export const usePlayerState = () => {
  const { player, options } = useContext(PlayerContext);

  const [paused, setPaused] = useState(true);
  const [ended, setEnded] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [source, setSource] = useState<Source | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onPlay = () => {
      setPaused(false);
      setEnded(player?.ended ?? false);
      setBuffering(false);
    };
    const onPause = () => {
      setPaused(true);
      setBuffering(false);
    };
    const onBuffering = () => setBuffering(true);
    const onDurationChange = () =>
      setDuration(options?.metadata?.duration ?? (player?.duration || 0));
    const onSourceChange = () => {
      if (!player?.currentSrc) {
        setSource(null);
        return;
      }
      setSource((prevSource) => {
        if (prevSource?.src !== player.currentSrc) {
          const currentSource = options?.sources?.find(
            (s) => s.src === player.currentSrc,
          );
          if (currentSource)
            return {
              src: currentSource.src,
              type: currentSource.type,
            };
        }
        return prevSource;
      });
    };
    const onEnded = () => setEnded(player?.ended ?? false);
    const onPlaybackRateChange = () =>
      setPlaybackRate(player?.playbackRate ?? 1);
    const onFullscreenChange = () =>
      setIsFullscreen(player?.isFullscreen() ?? false);
    const onVolumeChange = () => setVolume(player?.volume ?? 1);

    // initial values
    setPaused(player.paused ?? true);
    onDurationChange();
    onSourceChange();
    onVolumeChange();

    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("waiting", onBuffering);
    player.addEventListener("durationchange", onDurationChange);
    player.addEventListener("loadstart", onSourceChange);
    player.addEventListener("ended", onEnded);
    player.addEventListener("ratechange", onPlaybackRateChange);
    player.addEventListener("fullscreenchange", onFullscreenChange);
    player.addEventListener("volumechange", onVolumeChange);

    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("waiting", onBuffering);
      player.removeEventListener("durationchange", onDurationChange);
      player.removeEventListener("loadstart", onSourceChange);
      player.removeEventListener("ended", onEnded);
      player.removeEventListener("ratechange", onPlaybackRateChange);
      player.removeEventListener("fullscreenchange", onFullscreenChange);
      player.removeEventListener("volumechange", onVolumeChange);
    };
  }, [player, options]);

  return {
    paused,
    buffering,
    ended,
    playbackRate,
    duration,
    isFullscreen,
    volume,
    source,
  };
};
