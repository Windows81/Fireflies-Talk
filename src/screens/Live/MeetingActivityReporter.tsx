import { useEffect, type FC } from "react";
import { useIsTranscribing } from "./RealtimePanel/hooks/useIsTranscribing";

/**
 * Feeds the dictation pill the transcript activity it cannot see for itself.
 *
 * While the live bar is off screen the pill stands in for it, and its meter has
 * to move for the same reason the bar's does — new captions arriving. That
 * signal is derived from live-transcript state held in this renderer, so the
 * pill's own window has no way to compute it. Renders nothing.
 */
export const MeetingActivityReporter: FC = () => {
  const transcribing = useIsTranscribing();

  useEffect(() => {
    window.electron?.dictation?.reportMeetingActivity?.(transcribing);
  }, [transcribing]);

  // Leaving the meeting must not strand the meter mid-animation.
  useEffect(
    () => () => window.electron?.dictation?.reportMeetingActivity?.(false),
    [],
  );

  return null;
};
