import { toast } from "@/components/Toast";
import { useMutation } from "@apollo/client";
import {
  UpdateMeetingDocument,
  type MeetingNotesPrivacy,
} from "@firefliesai/mobile-ff.graphql-client";
import { useCallback, useEffect, useRef } from "react";

export const useUpdateMeetingMutation = () => {
  const [updateMeeting] = useMutation(UpdateMeetingDocument, {
    onError(error) {
      toast({
        title: "Failed to update",
        message: error.message,
        type: "error",
      });
    },
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdateRef = useRef<{
    id: string;
    title?: string;
    notesPrivacy?: MeetingNotesPrivacy;
  } | null>(null);

  const debouncedUpdateMeeting = useCallback(
    (variables: {
      id: string;
      title?: string;
      notesPrivacy?: MeetingNotesPrivacy;
    }) => {
      pendingUpdateRef.current = variables;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        updateMeeting({ variables });
        pendingUpdateRef.current = null;
      }, 1000);
    },
    [updateMeeting],
  );

  const flushPendingUpdate = useCallback(() => {
    if (pendingUpdateRef.current) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      updateMeeting({ variables: pendingUpdateRef.current });
      pendingUpdateRef.current = null;
    }
  }, [updateMeeting]);

  useEffect(() => {
    return () => {
      flushPendingUpdate();
    };
  }, [flushPendingUpdate]);

  return debouncedUpdateMeeting;
};
