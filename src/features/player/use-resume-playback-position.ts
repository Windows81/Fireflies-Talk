import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import {
  clearPlaybackPosition,
  getPlaybackPosition,
  isPositionWorthStoring,
  savePlaybackPosition,
} from "./playback-position";
import type { PlayerApi, Source } from "./types";

const SAVE_INTERVAL_MS = 5000;

interface UseResumePlaybackPositionParams {
  player: PlayerApi;
  mediaKey: string | undefined;
  canRestore: boolean;
  sources: Source[] | undefined;
}

export const useResumePlaybackPosition = ({
  player,
  mediaKey,
  canRestore,
  sources,
}: UseResumePlaybackPositionParams) => {
  const [resumedFromPosition, setResumedFromPosition] = useState<number | null>(
    null,
  );
  const lastSavedAtRef = useRef(0);
  const hasRestoredRef = useRef(false);
  const lastKnownPositionRef = useRef({ position: 0, duration: 0 });
  const hasReachedStorablePositionRef = useRef(false);

  const sourceUris = sources?.map((source) => source.src).join("|");
  const knownSourceUrisRef = useRef(new Set<string>());
  const isRewindPendingRef = useRef(false);
  const startFromBeginningRef = useRef<() => void>(() => {});

  const startNewSession = useCallback(() => {
    hasRestoredRef.current = false;
    lastSavedAtRef.current = 0;
    lastKnownPositionRef.current = { position: 0, duration: 0 };
    hasReachedStorablePositionRef.current = false;
    isRewindPendingRef.current = false;
    setResumedFromPosition(null);
  }, []);

  useEffect(() => {
    knownSourceUrisRef.current = new Set();
    startNewSession();
  }, [mediaKey, startNewSession]);

  useEffect(() => {
    if (!mediaKey) return;

    // A refreshed signed URL is only queued while the active one still plays,
    // so every URL the media has been given counts as the current media.
    sourceUris
      ?.split("|")
      .forEach((uri) => knownSourceUrisRef.current.add(uri));

    // The player is shared across media and keeps reporting the outgoing
    // source until the replacement finishes, so its position belongs to the
    // media the viewer just left until it loads one of the current sources.
    const isPlayerOnCurrentMedia = () =>
      knownSourceUrisRef.current.size === 0 ||
      !player.currentSrc ||
      knownSourceUrisRef.current.has(player.currentSrc);

    const rememberCurrentPosition = () => {
      if (!isPlayerOnCurrentMedia()) return;
      if (!isFinite(player.duration) || player.duration <= 0) return;
      lastKnownPositionRef.current = {
        position: player.currentTime,
        duration: player.duration,
      };
    };

    const persistLastKnownPosition = () => {
      const { position, duration } = lastKnownPositionRef.current;
      if (duration <= 0) return;
      if (isPositionWorthStoring(position, duration)) {
        hasReachedStorablePositionRef.current = true;
      } else if (!hasReachedStorablePositionRef.current) {
        return;
      }
      savePlaybackPosition(mediaKey, position, duration);
    };

    const persistCurrentPosition = () => {
      rememberCurrentPosition();
      persistLastKnownPosition();
    };

    const restoreSavedPosition = () => {
      if (hasRestoredRef.current) return;
      if (!canRestore) {
        hasRestoredRef.current = true;
        return;
      }
      if (!isPlayerOnCurrentMedia()) return;
      if (!isFinite(player.duration) || player.duration <= 0) return;

      // Playback can tick past zero before the duration is reported, so a
      // seek is what marks the playhead as the viewer's, not its value.
      if (player.hasSeeked) {
        hasRestoredRef.current = true;
        return;
      }

      const savedPosition = getPlaybackPosition(mediaKey);
      if (
        savedPosition === null ||
        !isPositionWorthStoring(savedPosition, player.duration)
      ) {
        hasRestoredRef.current = true;
        return;
      }

      player.currentTime = savedPosition;
      // The player ignores seeks until it is ready, so a later event retries.
      if (player.currentTime !== savedPosition) return;

      hasRestoredRef.current = true;
      setResumedFromPosition(savedPosition);
    };

    const retryPendingRewind = () => {
      if (!isRewindPendingRef.current) return;
      startFromBeginningRef.current();
    };

    const onTimeUpdate = () => {
      retryPendingRewind();
      restoreSavedPosition();
      rememberCurrentPosition();
      const now = Date.now();
      if (now - lastSavedAtRef.current < SAVE_INTERVAL_MS) return;
      lastSavedAtRef.current = now;
      persistLastKnownPosition();
    };

    const onEnded = () => {
      if (!isPlayerOnCurrentMedia()) return;
      lastKnownPositionRef.current = { position: 0, duration: 0 };
      clearPlaybackPosition(mediaKey);
    };

    // Loading a different URL for the same media restarts from zero, so the
    // saved position is restored again rather than overwritten with zero.
    const onSourceChange = () => {
      persistLastKnownPosition();
      startNewSession();
    };

    player.addEventListener("sourcechange", onSourceChange);
    player.addEventListener("canplay", retryPendingRewind);
    player.addEventListener("durationchange", restoreSavedPosition);
    player.addEventListener("timeupdate", onTimeUpdate);
    player.addEventListener("pause", persistCurrentPosition);
    player.addEventListener("ended", onEnded);

    const appStateSubscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state !== "active") persistCurrentPosition();
      },
    );

    return () => {
      persistLastKnownPosition();
      player.removeEventListener("sourcechange", onSourceChange);
      player.removeEventListener("canplay", retryPendingRewind);
      player.removeEventListener("durationchange", restoreSavedPosition);
      player.removeEventListener("timeupdate", onTimeUpdate);
      player.removeEventListener("pause", persistCurrentPosition);
      player.removeEventListener("ended", onEnded);
      appStateSubscription.remove();
    };
  }, [player, mediaKey, canRestore, sourceUris, startNewSession]);

  const startFromBeginning = useCallback(() => {
    player.currentTime = 0;
    // The player ignores seeks until it is ready, so a later event retries.
    if (player.currentTime !== 0) {
      isRewindPendingRef.current = true;
      return;
    }
    isRewindPendingRef.current = false;
    if (mediaKey) clearPlaybackPosition(mediaKey);
    lastKnownPositionRef.current = { position: 0, duration: 0 };
    setResumedFromPosition(null);
  }, [player, mediaKey]);

  useEffect(() => {
    startFromBeginningRef.current = startFromBeginning;
  }, [startFromBeginning]);

  return { resumedFromPosition, startFromBeginning };
};
