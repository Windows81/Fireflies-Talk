import { LoadingScreen } from "@/components/Loading";
import { NotFoundScreen } from "@/components/Error";
import { DesktopNotepadContent } from "@/screens/DesktopNotepad/DesktopNotepadContent";
import { useDesktopNotepadMeeting } from "@/screens/DesktopNotepad/hooks/useDesktopNotepadMeeting";
import { type FC } from "react";

/**
 * Renders the desktop notepad in place once a recording ends, so the transition
 * from realtime panel → notepad is seamless on the same /live route. The Apollo
 * cache already holds the meeting, so this paints immediately. Back mirrors the
 * realtime panel's nav via closeAndFocusMain: it closes the floating live window
 * when running there, or — in the one-window model — sends the main window to
 * home (the IPC only closes non-main sender windows).
 */
export const PostMeetingNotepad: FC<{ meetingId: string }> = ({
  meetingId,
}) => {
  const { meeting, loading } = useDesktopNotepadMeeting(meetingId);

  if (!meeting && loading) {
    return <LoadingScreen />;
  }

  if (!meeting) {
    return (
      <NotFoundScreen
        title="Meeting not found"
        description="It does not exist or you do not have access"
      />
    );
  }

  return (
    <DesktopNotepadContent
      meeting={meeting}
      fromRecording
      visitSource="rtp"
      onBack={() => window.electron?.window?.closeAndFocusMain()}
    />
  );
};
