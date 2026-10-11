import { usePlayer, usePlayerState } from "@/features/player";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

const SEEK_STEP = 10;

// Arrow-key seeking is ignored while typing so it never steals input from the
// summary editor, AskFred, or any other text field.
const isEditableTarget = (target: EventTarget | null): boolean => {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    element.isContentEditable
  );
};

export interface AudioPlayback {
  paused: boolean;
  duration: number;
  current: number;
  playbackRate: number;
  togglePlay: () => void;
  seekBy: (delta: number) => void;
  setPlaybackRate: (rate: number) => void;
  onScrubStart: () => void;
  onScrub: (value: number) => void;
  onScrubCommit: (value: number) => void;
}

export const useAudioPlayback = (): AudioPlayback => {
  const { player } = usePlayer();
  const { paused, duration, playbackRate } = usePlayerState();

  const [current, setCurrent] = useState(0);
  const isScrubbingRef = useRef(false);

  useEffect(() => {
    const sync = () => {
      if (isScrubbingRef.current) return;
      setCurrent(player.currentTime);
    };
    player.addEventListener("timeupdate", sync);
    player.addEventListener("seeked", sync);
    sync();
    return () => {
      player.removeEventListener("timeupdate", sync);
      player.removeEventListener("seeked", sync);
    };
  }, [player]);

  const togglePlay = useCallback(() => {
    if (player.ended) {
      player.currentTime = 0;
      player.play();
    } else if (player.paused) {
      player.play();
    } else {
      player.pause();
    }
  }, [player]);

  const seekBy = useCallback(
    (delta: number) => {
      const next = Math.min(Math.max(player.currentTime + delta, 0), duration);
      player.currentTime = next;
    },
    [player, duration],
  );

  const setPlaybackRate = useCallback(
    (rate: number) => {
      player.playbackRate = rate;
    },
    [player],
  );

  // Left/right arrows jump back/forward by SEEK_STEP seconds.
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      seekBy(event.key === "ArrowLeft" ? -SEEK_STEP : SEEK_STEP);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [seekBy]);

  const onScrubStart = useCallback(() => {
    isScrubbingRef.current = true;
  }, []);

  const onScrub = useCallback((value: number) => {
    setCurrent(value);
  }, []);

  const onScrubCommit = useCallback(
    (value: number) => {
      player.currentTime = value;
      isScrubbingRef.current = false;
    },
    [player],
  );

  return {
    paused,
    duration,
    current,
    playbackRate,
    togglePlay,
    seekBy,
    setPlaybackRate,
    onScrubStart,
    onScrub,
    onScrubCommit,
  };
};

export { SEEK_STEP };
