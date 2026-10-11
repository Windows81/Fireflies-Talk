import { useEffect, useRef } from "react";
import { tracker, TRACKING_EVENTS } from "@/tracking";

type AiAppName = "Daily Brief" | "Meeting Prep" | "Tasks";

type Args = {
  appTitle: AiAppName;
  appId?: string;
  outputId?: string;
};

export function useAiAppViewedTracking({ appTitle, appId, outputId }: Args) {
  const lastTrackedKey = useRef<string | null>(null);

  useEffect(() => {
    const areChangesReady = appId && outputId;
    if (!areChangesReady) return;

    const key = `${appTitle}|${appId ?? ""}|${outputId ?? ""}`;
    if (lastTrackedKey.current === key) return;
    lastTrackedKey.current = key;

    tracker.track(TRACKING_EVENTS.PERSON_VIEWING_APP_OUTPUT, {
      appTitle,
      appId,
      outputId,
      source: "mobile",
    });
  }, [appTitle, appId, outputId]);
}
