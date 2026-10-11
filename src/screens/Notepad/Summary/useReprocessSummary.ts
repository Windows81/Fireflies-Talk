import { toast } from "@/components/Toast";
import { useRunSummaryManuallyMutation } from "@/graphql";
import {
  GetMeetingSummaryQueryDocument,
  type Meeting,
} from "@firefliesai/mobile-ff.graphql-client";
import { useCallback } from "react";

export const useReprocessSummary = (meeting: Meeting) => {
  const [runSummaryManually, { loading, data }] = useRunSummaryManuallyMutation(
    {
      awaitRefetchQueries: true,
      refetchQueries: [
        {
          query: GetMeetingSummaryQueryDocument,
          variables: { meetingId: meeting.id },
        },
      ],
      variables: {
        meetingId: meeting.id,
      },
    },
  );

  const reprocessSummary = useCallback(() => {
    void runSummaryManually()
      .then(({ data }) => {
        if (!data?.runSummaryManually) {
          toast({
            message: "Something went wrong. Please try again later",
          });
          return;
        }

        toast({
          message: "Summary reprocessed",
        });
      })
      .catch((err: Error) => {
        toast({
          title: "Could not reprocess meeting summary",
          type: "error",
          message: err.message,
        });
      });
  }, [runSummaryManually]);

  return [
    reprocessSummary,
    {
      loading,
      data,
    },
  ] as const;
};
