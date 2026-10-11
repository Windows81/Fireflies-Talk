import { toast } from "@/components/Toast";
import { useUpdateMeetingNoteSummaryMutation } from "@/graphql";
import { GetMeetingSummaryQueryDocument } from "@firefliesai/mobile-ff.graphql-client";
import { useCallback } from "react";

export interface UpdateNotepadSummary {
  save: (key: string, value: string) => Promise<void>;
  saving: boolean;
}

// Persists a single edited summary section's markdown and refetches the summary
// so the rendered view reflects the saved content.
export function useUpdateNotepadSummary(
  meetingId: string,
): UpdateNotepadSummary {
  const [mutate, { loading }] = useUpdateMeetingNoteSummaryMutation({
    refetchQueries: [
      { query: GetMeetingSummaryQueryDocument, variables: { meetingId } },
    ],
  });

  const save = useCallback(
    async (key: string, value: string) => {
      try {
        const { data } = await mutate({
          variables: { meetingId, jsonComment: [{ key, value }] },
        });
        if (!data?.updateMeetingNoteSummary) {
          throw new Error("Could not save summary changes");
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not save summary changes";
        toast({
          title: "Failed to update summary",
          message,
          type: "error",
        });
        throw error;
      }
    },
    [mutate, meetingId],
  );

  return { save, saving: loading };
}
