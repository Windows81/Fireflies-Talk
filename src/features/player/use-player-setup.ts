import { getErrorMessage } from "@/errors";
import { Logger } from "@/logger";
import { captureException } from "@sentry/browser";
import { useEventListener } from "expo";
import type { VideoView } from "expo-video";
import { useVideoPlayer, type VideoPlayer, type VideoSource } from "expo-video";
import type { Emitter } from "mitt";
import mitt from "mitt";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { useRecorder } from "../live-record";
import type {
  ContextValue,
  Options,
  PlayerApi,
  PlayerApiEventName,
  VideoPlayerStatusObject,
} from "./types";

const logger = new Logger("VideoPlayer");

export const usePlayerSetup = (
  options: Options | null,
): Pick<
  ContextValue,
  "player" | "videoPlayer" | "videoViewRef" | "statusRef"
> => {
  const videoViewRef = useRef<VideoView | null>(null);

  const emitterRef = useRef(
    null as unknown as Emitter<Record<PlayerApiEventName, void>>,
  );
  emitterRef.current = emitterRef.current || mitt();

  useEffect(
    () => () => {
      emitterRef.current.all.clear();
    },
    [],
  );

  const statusRef = useRef<VideoPlayerStatusObject>({
    isReady: false,
    isPlaying: false,
    didJustFinish: false,
    position: 0,
    duration: 0,
    isFullscreen: false,
    volume: 1,
    rate: 1,
    source: null,
  });
  const hasLoadedOnceRef = useRef(false);
  const hasSeekedRef = useRef(false);
  const configuredPlayerRef = useRef<VideoPlayer | null>(null);

  // Track the initial source URI to detect changes
  const [initialSourceUri, setInitialSourceUri] = useState(
    () => options?.sources?.[0]?.src,
  );
  const currentSourceUriRef = useRef<string | undefined>(initialSourceUri);
  const pendingSourceRef = useRef<VideoSource | null>(null);
  const userInitiatedPlaybackRef = useRef(false);
  const pendingUserPlayRef = useRef(false);
  const lastPlayerStatusRef = useRef<
    "idle" | "loading" | "readyToPlay" | "error" | null
  >(null);

  const source = useMemo<VideoSource>(() => {
    if (!options?.sources) return {};
    return {
      uri: options.sources[0]?.src,
      metadata: options.metadata || undefined,
    };
  }, [options?.sources, options?.metadata]);

  // Create the video player with the initial source only
  const initialSource = useMemo<VideoSource>(() => {
    if (!initialSourceUri) return {};
    return {
      uri: initialSourceUri,
      metadata: options?.metadata || undefined,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSourceUri]);

  useEffect(() => {
    if (initialSourceUri) return;
    const firstUri = options?.sources?.[0]?.src;
    if (!firstUri) return;

    currentSourceUriRef.current = firstUri;
    setInitialSourceUri(firstUri);
  }, [initialSourceUri, options?.sources]);

  const getSourceUri = useCallback((videoSource: VideoSource) => {
    if (
      typeof videoSource === "object" &&
      videoSource !== null &&
      "uri" in videoSource
    ) {
      return videoSource.uri;
    }
    return typeof videoSource === "string" ? videoSource : undefined;
  }, []);

  const configurePlayer = useCallback((player: VideoPlayer) => {
    if (configuredPlayerRef.current === player) return;

    player.timeUpdateEventInterval = 1;
    player.audioMixingMode =
      // if audioMixingMode is set to something other than "mixWithOthers", recording will not work
      useRecorder.getState().status.state !== "inactive"
        ? "mixWithOthers"
        : "auto";
    player.showNowPlayingNotification = true;
    player.staysActiveInBackground = true;
    player.preservesPitch = true;

    configuredPlayerRef.current = player;
  }, []);

  const playIfAllowed = useCallback(
    (player: VideoPlayer, shouldResumePlayback: boolean) => {
      if (!shouldResumePlayback) return;
      if (Platform.OS === "web" && !userInitiatedPlaybackRef.current) {
        logger.info("Skipping autoplay on web until user interaction");
        return;
      }
      try {
        player.play();
      } catch (err) {
        captureException(
          new Error(getErrorMessage(err, "videoApi.playIfAllowed")),
          {
            contexts: {
              status: statusRef.current,
            },
            tags: {
              section: "player",
            },
          },
        );
      }
    },
    [],
  );

  const videoPlayer = useVideoPlayer(initialSource, (videoPlayer) => {
    const hasValidSource =
      typeof initialSource === "object" &&
      initialSource !== null &&
      "uri" in initialSource &&
      initialSource.uri;

    configurePlayer(videoPlayer);

    if (!hasValidSource) {
      logger.info("Skipping video player setup - no source yet");
      return;
    }

    logger.info("Setting up video player");

    playIfAllowed(videoPlayer, true);
  });

  const replaceSource = useCallback(
    (nextSource: VideoSource, shouldResumePlayback: boolean) => {
      const nextUri = getSourceUri(nextSource);
      if (!nextUri) return;

      logger.info("Replacing video source with updated URL");
      statusRef.current.isReady = false;

      videoPlayer
        .replaceAsync(nextSource)
        .then(() => {
          if (Platform.OS !== "web") {
            playIfAllowed(videoPlayer, shouldResumePlayback);
          }
        })
        .catch((err) => {
          captureException(
            new Error(getErrorMessage(err, "videoApi.replaceAsync")),
            {
              contexts: {
                status: statusRef.current,
              },
              tags: {
                section: "player",
              },
            },
          );
        });
    },
    [getSourceUri, videoPlayer, playIfAllowed],
  );

  const applyPendingSource = useCallback(
    (shouldResumePlayback: boolean) => {
      if (!pendingSourceRef.current) return;
      const pendingSource = pendingSourceRef.current;
      pendingSourceRef.current = null;
      replaceSource(pendingSource, shouldResumePlayback);
    },
    [replaceSource],
  );

  // Use replace() method to update source when it changes (e.g., signedUrl refresh)
  // This prevents crashes on Android's expo-video implementation
  useEffect(() => {
    if (!initialSourceUri) return;

    const currentUri = getSourceUri(source);
    const activeUri = currentSourceUriRef.current;

    // Skip if no valid source or if it's already the active one
    if (!currentUri || currentUri === activeUri) {
      return;
    }

    // If we already have an active source (even if still loading), queue the new URL as a fallback.
    if (activeUri) {
      logger.info(
        "Queuing updated video source as fallback (active source present)",
      );
      pendingSourceRef.current = source;
      return;
    }

    const shouldResumePlayback =
      statusRef.current.isPlaying || !hasLoadedOnceRef.current;

    replaceSource(source, shouldResumePlayback);
  }, [getSourceUri, replaceSource, source]);

  useEventListener(videoPlayer, "playingChange", ({ isPlaying }) => {
    statusRef.current.isPlaying = isPlaying;
    emitterRef.current.emit(isPlaying ? "play" : "pause");
    if (isPlaying) {
      statusRef.current.didJustFinish = false;
      pendingUserPlayRef.current = false;
    }
  });
  useEventListener(videoPlayer, "playToEnd", () => {
    statusRef.current.didJustFinish = true;
    emitterRef.current.emit("ended");
  });
  useEventListener(videoPlayer, "timeUpdate", ({ currentTime }) => {
    statusRef.current.position = currentTime;
    emitterRef.current.emit("timeupdate");

    if (videoPlayer.duration !== statusRef.current.duration) {
      statusRef.current.duration = videoPlayer.duration;
      emitterRef.current.emit("durationchange");
    }
  });
  useEventListener(videoPlayer, "playbackRateChange", ({ playbackRate }) => {
    statusRef.current.rate = playbackRate;
    emitterRef.current.emit("ratechange");
  });
  useEventListener(videoPlayer, "sourceChange", ({ source }) => {
    hasLoadedOnceRef.current = false;
    statusRef.current.didJustFinish = false;
    statusRef.current.isReady = false;
    statusRef.current.source = source;
    statusRef.current.position = 0;
    statusRef.current.duration = 0;
    hasSeekedRef.current = false;
    currentSourceUriRef.current = getSourceUri(source);
    emitterRef.current.emit("timeupdate");
    emitterRef.current.emit("sourcechange");
  });
  useEventListener(videoPlayer, "volumeChange", () => {
    statusRef.current.volume = videoPlayer.volume;
    emitterRef.current.emit("volumechange");
  });
  useEventListener(videoPlayer, "statusChange", (status) => {
    statusRef.current.isReady = status.status === "readyToPlay";
    lastPlayerStatusRef.current = status.status;

    if (status.status === "readyToPlay") {
      // Clear any pending source if current one is ready
      pendingSourceRef.current = null;

      if (pendingUserPlayRef.current) {
        pendingUserPlayRef.current = false;
        if (Platform.OS !== "web") {
          playIfAllowed(videoPlayer, true);
        }
      }

      if (!hasLoadedOnceRef.current) {
        hasLoadedOnceRef.current = true;
        if (typeof options?.initialTime === "number") {
          videoPlayer.currentTime = options.initialTime;
        }
      }

      if (videoPlayer.duration !== statusRef.current.duration) {
        statusRef.current.duration = videoPlayer.duration;
        emitterRef.current.emit("durationchange");
      }

      emitterRef.current.emit("canplay");
    }

    if (status.error) {
      const wasPlaying = statusRef.current.isPlaying;
      statusRef.current.isPlaying = false;
      if (wasPlaying) {
        emitterRef.current.emit("pause");
      }

      // On web, wait for a user gesture before swapping sources (expo-video replaceAsync autoplays on web).
      if (Platform.OS !== "web") {
        applyPendingSource(true);
      }

      captureException(new Error(status.error.message), {
        contexts: {
          status: statusRef.current,
        },
        tags: {
          section: "player",
        },
      });
    }
  });

  const player = useMemo<PlayerApi>(() => {
    return {
      play: () => {
        try {
          userInitiatedPlaybackRef.current = true;
          if (
            Platform.OS === "web" &&
            lastPlayerStatusRef.current === "error" &&
            pendingSourceRef.current
          ) {
            applyPendingSource(true);
            return;
          }
          if (Platform.OS === "web") {
            playIfAllowed(videoPlayer, true);
            return;
          }
          if (!statusRef.current.isReady) {
            pendingUserPlayRef.current = true;
            return;
          }
          playIfAllowed(videoPlayer, true);
        } catch (err) {
          captureException(
            new Error(getErrorMessage(err, "videoApi.playAsync")),
            {
              contexts: {
                status: statusRef.current,
              },
              tags: {
                section: "player",
              },
            },
          );
        }
      },
      pause: () => {
        try {
          if (!statusRef.current.isReady) return;
          videoPlayer.pause();
        } catch (err) {
          captureException(
            new Error(getErrorMessage(err, "videoApi.pauseAsync")),
            {
              contexts: {
                status: statusRef.current,
              },
              tags: {
                section: "player",
              },
            },
          );
        }
      },
      get paused() {
        return !statusRef.current.isPlaying;
      },
      get ended() {
        return statusRef.current.didJustFinish;
      },
      get currentTime() {
        return statusRef.current.position;
      },
      set currentTime(time) {
        try {
          if (!statusRef.current.isReady) return;
          emitterRef.current.emit("seeking");
          videoPlayer.currentTime = time;
          hasSeekedRef.current = true;
          // Reflect the new position immediately so currentTime getters (and
          // "seeked" listeners) read the fresh value before expo's next tick.
          statusRef.current.position = time;
          emitterRef.current.emit("seeked");
        } catch (err) {
          captureException(
            new Error(getErrorMessage(err, "videoApi.setPositionAsync")),
            {
              contexts: {
                status: statusRef.current,
              },
              tags: {
                section: "player",
              },
            },
          );
        }
      },
      get duration() {
        return statusRef.current.duration;
      },
      get hasSeeked() {
        return hasSeekedRef.current;
      },
      get currentSrc() {
        if (typeof statusRef.current.source === "object") {
          return statusRef.current.source?.uri || "";
        }
        return String(statusRef.current.source);
      },
      get playbackRate() {
        return statusRef.current.rate;
      },
      set playbackRate(rate) {
        if (!statusRef.current.isReady) return;
        try {
          videoPlayer.playbackRate = rate;
        } catch (err) {
          captureException(
            new Error(getErrorMessage(err, "videoApi.setRateAsync")),
            {
              contexts: {
                status: statusRef.current,
              },
              tags: {
                section: "player",
              },
            },
          );
        }
      },
      get volume() {
        return statusRef.current.volume;
      },
      set volume(volume) {
        try {
          if (!statusRef.current.isReady) return;
          videoPlayer.volume = volume;
        } catch (err) {
          captureException(
            new Error(getErrorMessage(err, "videoApi.setStatusAsync")),
            {
              contexts: {
                status: statusRef.current,
              },
              tags: {
                section: "player",
              },
            },
          );
        }
      },
      requestFullscreen() {
        if (!statusRef.current.isReady) return;
        videoViewRef.current?.enterFullscreen().catch((err) => {
          captureException(
            new Error(getErrorMessage(err, "videoApi.presentFullscreenPlayer")),
            {
              contexts: {
                status: statusRef.current,
              },
              tags: {
                section: "player",
              },
            },
          );
        });
      },
      exitFullscreen() {
        if (!statusRef.current.isReady) return;
        videoViewRef.current?.exitFullscreen().catch((err) =>
          captureException(
            new Error(getErrorMessage(err, "videoApi.dismissFullscreenPlayer")),
            {
              contexts: {
                status: statusRef.current,
              },
              tags: {
                section: "player",
              },
            },
          ),
        );
      },
      isFullscreen() {
        return statusRef.current.isFullscreen;
      },
      addEventListener(event, callback) {
        emitterRef.current.on(event, callback);
      },
      removeEventListener(event, callback) {
        emitterRef.current.off(event, callback);
      },
      emit(event) {
        emitterRef.current.emit(event);
      },
    };
  }, [videoPlayer]);

  return {
    player,
    videoViewRef,
    videoPlayer,
    statusRef,
  };
};
