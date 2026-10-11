import { toast } from "@/components/Toast";
import { captureException } from "@/errors";
import { useGenerateAppOutputAudioMutation } from "@/graphql";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { useEventListener } from "expo";
import { useVideoPlayer } from "expo-video";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Surface the audio control is rendered on, used to scope analytics. */
export type BriefAudioSource = "detail" | "card";

/**
 * Wraps the generateAppOutputAudio mutation into a simple `generate(eventId)`
 * call that resolves to the audio URL.
 */
export function useGenerateBriefAudio() {
  const [generateAudio] = useGenerateAppOutputAudioMutation();

  return useCallback(
    async (eventId: string) => {
      const result = await generateAudio({ variables: { eventId } });
      return result.data?.generateAppOutputAudio;
    },
    [generateAudio],
  );
}

interface UseBriefAudioPlayerParams {
  /** Cached audio URL, played directly without generating when present. */
  audioUrl?: string | null;
  /** Resolves the playable URL on first press (fetch event + generate). */
  onGenerate: () => Promise<string | null | undefined>;
  /** Surface rendering the control, used to scope analytics. */
  source: BriefAudioSource;
}

/**
 * Tracks the single brief clip that is currently playing so starting one
 * control stops any other (e.g. another day in the list) and rewinds it to the
 * start. Module-scoped on purpose: only one brief narration should ever play
 * at a time, app-wide.
 */
let activeBriefAudio: { id: object; stop: () => void } | null = null;

/**
 * Tracks which clip currently owns the lock-screen notification. Kept separate
 * from `activeBriefAudio` because a paused clip keeps its notification (so it
 * can be resumed from the lock screen) while no longer being the active one.
 */
let briefNotificationOwner: { id: object; hide: () => void } | null = null;

/** Shown on the lock screen / media notification while the brief plays. */
const BRIEF_AUDIO_METADATA = {
  title: "Daily Brief",
  artist: "Fireflies.ai",
};

/**
 * Shared playback engine for the brief audio controls. Owns the expo-video
 * player, the play/generate state machine, and error handling so both the
 * per-day button and the home-card button stay in sync.
 */
export function useBriefAudioPlayer({
  audioUrl,
  onGenerate,
  source,
}: UseBriefAudioPlayerParams) {
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const pendingPlayRef = useRef(false);
  const endedRef = useRef(false);
  const instanceIdRef = useRef({});

  const playableUrl = audioUrl ?? generatedUrl;

  const videoSource = useMemo(
    () =>
      playableUrl ? { uri: playableUrl, metadata: BRIEF_AUDIO_METADATA } : null,
    [playableUrl],
  );
  const player = useVideoPlayer(videoSource);

  useEventListener(player, "playingChange", ({ isPlaying: playing }) => {
    setIsPlaying(playing);
    if (playing) {
      pendingPlayRef.current = false;
      endedRef.current = false;
      // Keep the narration running once the app is backgrounded or the screen
      // locks, and surface lock-screen controls. Set here rather than in the
      // player setup because every brief row builds its own player, and only
      // the clip that actually reached playback should own the notification.
      if (briefNotificationOwner?.id !== instanceIdRef.current) {
        briefNotificationOwner?.hide();
        briefNotificationOwner = {
          id: instanceIdRef.current,
          hide: () => {
            player.showNowPlayingNotification = false;
          },
        };
      }
      player.staysActiveInBackground = true;
      player.showNowPlayingNotification = true;
      // Stop whichever other brief clip was playing, then claim the slot.
      if (activeBriefAudio && activeBriefAudio.id !== instanceIdRef.current) {
        activeBriefAudio.stop();
      }
      activeBriefAudio = {
        id: instanceIdRef.current,
        stop: () => {
          player.pause();
          player.currentTime = 0;
        },
      };
    } else if (activeBriefAudio?.id === instanceIdRef.current) {
      activeBriefAudio = null;
    }
  });

  useEventListener(player, "playToEnd", () => {
    endedRef.current = true;
    // Drop the lock-screen controls once the clip finishes: native play() is a
    // no-op at the end of a track, so the notification's play button would be
    // dead (in-app playback rewinds with replay() instead).
    if (briefNotificationOwner?.id === instanceIdRef.current) {
      briefNotificationOwner.hide();
      briefNotificationOwner = null;
    }
  });

  useEventListener(player, "statusChange", ({ status }) => {
    if (status === "readyToPlay" && pendingPlayRef.current) {
      pendingPlayRef.current = false;
      player.play();
    }
    // Surface load failures (e.g. stale/expired audio URL) when the user was
    // trying to play, and clear the pending flag so the button isn't stuck.
    if (status === "error") {
      if (pendingPlayRef.current) {
        toast({
          title: "Couldn't play audio",
          message: "The audio couldn't be loaded. Please try again.",
          type: "error",
        });
      }
      pendingPlayRef.current = false;
    }
  });

  useEffect(() => {
    const instanceId = instanceIdRef.current;
    return () => {
      if (activeBriefAudio?.id === instanceId) {
        activeBriefAudio = null;
      }
      if (briefNotificationOwner?.id === instanceId) {
        briefNotificationOwner = null;
      }
    };
  }, []);

  const handlePress = useCallback(async () => {
    if (isGenerating) return;

    if (playableUrl) {
      if (isPlaying) {
        player.pause();
        return;
      }
      // Ignore rapid repeat taps while a play request is already in flight.
      if (pendingPlayRef.current) return;
      tracker.track(TRACKING_EVENTS.DAILY_BRIEF_AUDIO_PLAYED, {
        from: source,
        generated: false,
      });
      pendingPlayRef.current = true;
      // play() is a no-op once the track has reached the end; replay() rewinds.
      if (endedRef.current) {
        endedRef.current = false;
        player.replay();
      } else {
        player.play();
      }
      return;
    }

    setIsGenerating(true);
    try {
      const newUrl = await onGenerate();
      if (!newUrl) {
        throw new Error("Audio couldn't be generated. Please try again.");
      }
      tracker.track(TRACKING_EVENTS.DAILY_BRIEF_AUDIO_PLAYED, {
        from: source,
        generated: true,
      });
      setGeneratedUrl(newUrl);
      pendingPlayRef.current = true;
    } catch (error) {
      captureException(error as Error, {
        tags: { section: "daily-brief-audio" },
      });
      toast({
        title: "Couldn't generate audio",
        message:
          error instanceof Error
            ? error.message
            : "Audio couldn't be generated. Please try again.",
        type: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, isPlaying, onGenerate, playableUrl, player, source]);

  return { player, isPlaying, isGenerating, handlePress };
}
