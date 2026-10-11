import { toast } from "@/components/Toast";
import { useAuth } from "@/features/auth";
import {
  uploadManualNotesForMeeting,
  useManualNotes,
} from "@/features/manual-notes";
import { useCallback } from "react";
import { useLiveScreenContext } from "../../Context/LiveScreenContext";

/**
 * "Merge to summary" preference for manual notes. Mirrors the owner-gating and
 * re-upload behavior of ManualNotesPanel so the header toggle and the editor
 * stay in sync via the shared manual-notes store.
 */
export function useMergeToSummary(meetingId: string) {
  const { meeting } = useLiveScreenContext();
  const { user } = useAuth();
  const { notes, shouldMerge, setShouldMerge } = useManualNotes(meetingId);

  const isOwner = Boolean(
    user?.email && meeting?.organizerEmail === user.email,
  );

  const handleChange = useCallback(
    (next: boolean) => {
      setShouldMerge(next);
      if (notes.trim()) {
        void uploadManualNotesForMeeting(meetingId, { clearOnSuccess: false });
      }
      toast(
        next
          ? {
              type: "success",
              message:
                "Your notes will be added to this meeting's summary when the call ends.",
            }
          : {
              type: "info",
              message:
                "Your notes won't be added to the meeting summary — they'll stay in your notes only.",
            },
      );
    },
    [setShouldMerge, notes, meetingId],
  );

  return { shouldMerge, setShouldMerge: handleChange, isOwner };
}
