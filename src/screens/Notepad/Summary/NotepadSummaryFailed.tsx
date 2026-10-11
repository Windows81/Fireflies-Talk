import { Button } from "@/components/Button";
import { MessageView } from "@/components/Message";
import type { Meeting } from "@/graphql";
import type { FC } from "react";
import { useReprocessSummary } from "./useReprocessSummary";

export const NotepadSummaryFailed: FC<{
  meeting: Meeting;
}> = ({ meeting }) => {
  const [reprocessSummary, { loading }] = useReprocessSummary(meeting);

  // runSummaryManually mutation will block until the summary is processed, so we can show a loading state while waiting for the mutation to complete
  if (loading) {
    return (
      <MessageView
        title="Summary is being processed"
        description="Please check back in few minutes"
      />
    );
  }

  return (
    <MessageView
      title="An error occurred while generating summary"
      variant="error"
      action={
        <Button onPress={reprocessSummary} disabled={loading}>
          Reprocess summary
        </Button>
      }
    />
  );
};
