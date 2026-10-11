import { useUpdateMeetingMutation } from "@/features/meeting";
import { useCallback } from "react";
import { localRecordStoreApi } from "./local-record.store";
import { useRecorder } from "./record.store";

/**
 * Live-saves an edited title for the active recording: the recorder context
 * (and local record) update immediately — so the floating bar reflects it at
 * once — while the server mutation is debounced (and flushed on unmount).
 */
export const useSaveRecordingTitle = () => {
  const updateMeeting = useUpdateMeetingMutation();
  const context = useRecorder((s) => s.context);
  const setContext = useRecorder((s) => s.setContext);

  const saveTitle = useCallback(
    (title: string) => {
      if (!context) return;

      const newTitle = title.trim();
      if (!newTitle || newTitle === context.title) return;

      const newContext = { ...context, title: newTitle };
      setContext(newContext);

      // A recording started offline has no meeting to rename yet — it is
      // created at upload time from the title saved here.
      if (context.meetingId) {
        updateMeeting({ id: context.meetingId, title: newTitle });
      }

      localRecordStoreApi.updateByUri(newContext.fileUri, newContext);
    },
    [context, setContext, updateMeeting],
  );

  return { saveTitle };
};
