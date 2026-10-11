import { FEATURE_FLAGS, useFeatureValue } from "@/features/feature-flags";
import { useLocalSettings } from "@/features/settings";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { SpeakerSourceTelemetry } from "electron/src/types";
import { useEffect } from "react";

// Counts only: no names, no meeting id, nothing said on the call.
function trackTelemetry(event: SpeakerSourceTelemetry) {
  if (event.kind === "detected") {
    tracker.track(TRACKING_EVENTS.DESKTOP_MEET_SPEAKERS_DETECTED, {
      platform: event.platform,
    });
    return;
  }
  tracker.track(TRACKING_EVENTS.DESKTOP_MEET_SPEAKER_SELECTOR_DRIFT, {
    platform: event.platform,
    reason: event.reason,
    durationMs: event.durationMs,
  });
}

/**
 * Hands the desktop app the beta setting and the GrowthBook selectors that
 * drive speaker names, and reports how well those selectors hold up.
 * Mount once, in the main window.
 */
export function useSpeakerSourceConfigSync(): void {
  const enabled = useLocalSettings((state) => state.meetSpeakerNamesBeta);
  // Main normalizes the shape; anything malformed falls back to defaults.
  const selectors = useFeatureValue<Record<string, unknown> | null>(
    FEATURE_FLAGS.DESKTOP_MEET_SPEAKER_SELECTORS,
    null,
  );

  useEffect(() => {
    window.electron?.speakerSource.configure({ enabled, selectors });
  }, [enabled, selectors]);

  useEffect(
    () => window.electron?.speakerSource.onTelemetry(trackTelemetry),
    [],
  );
}
