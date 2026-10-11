import { toast } from "@/components/Toast";
import {
  GetMeetingManualNotesDocument,
  useRunSummaryManuallyMutation,
} from "@/graphql";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { useState } from "react";
import { useSummaryProcessing } from "./useSummaryProcessing";

// Merging re-runs the summary with manual notes folded in; the merged flag also
// lives on the manual-notes query, so refetch it alongside meeting + summary.
const MERGE_REFETCH_DOCUMENTS = [GetMeetingManualNotesDocument];

export const useMergeManualNotes = (meetingId: string) => {
  const [isMerging, setIsMerging] = useState(false);

  const {
    start: startPolling,
    acquireProcessing,
    releaseProcessing,
  } = useSummaryProcessing(meetingId, {
    refetchDocuments: MERGE_REFETCH_DOCUMENTS,
    onSettled: () => setIsMerging(false),
  });

  const [mutate] = useRunSummaryManuallyMutation();

  const merge = () => {
    setIsMerging(true);
    tracker.track(TRACKING_EVENTS.NOTEPAD_NOTES_MERGED, { meetingId });
    // Hold the processing slot for the whole in-flight duration so the summary
    // shows its skeleton state immediately, not just once polling starts.
    acquireProcessing();
    mutate({ variables: { meetingId, mergeManualNotes: true } })
      .then(({ data }) => {
        if (!data?.runSummaryManually) {
          releaseProcessing();
          setIsMerging(false);
          toast({ message: "Something went wrong. Please try again later" });
          return;
        }
        toast("Merging your notes into the summary…");
        startPolling({ processingHeld: true });
      })
      .catch((error: Error) => {
        releaseProcessing();
        setIsMerging(false);
        toast({
          type: "error",
          title: "Could not merge notes",
          message: error.message,
        });
      });
  };

  return { merge, isMerging };
};
