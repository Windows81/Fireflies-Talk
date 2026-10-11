import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import type { FC } from "react";
import { LiveScreenCompactContent } from "./LiveScreenCompactContent";
import { LiveScreenCompactContent as LegacyLiveScreenCompactContent } from "./legacy/LiveScreenCompactContent";

interface LiveCompactSurfaceProps {
  meeting: Meeting | null;
  onToggleViewMode?: () => void;
}

/**
 * The compact live window's content. The Universal Pill redesigned the bar to
 * share the dictation pill's surface, dock to any edge, and be dragged; it
 * ships behind the dictation flag, so users without Fireflies Talk keep the
 * bar as it was before: top-centred, panels opening downward.
 */
export const LiveCompactSurface: FC<LiveCompactSurfaceProps> = ({
  meeting,
  onToggleViewMode,
}) => {
  // The Universal Pill is shelved for now: the legacy bar is the default
  // whether the dictation flag is on or off. Re-key this to
  // useIsDictationAvailable() to ship it.
  const isUniversalPill = false;

  if (!isUniversalPill) {
    return (
      <LegacyLiveScreenCompactContent
        meeting={meeting}
        onToggleViewMode={onToggleViewMode}
      />
    );
  }

  return (
    <LiveScreenCompactContent
      meeting={meeting}
      onToggleViewMode={onToggleViewMode}
    />
  );
};
