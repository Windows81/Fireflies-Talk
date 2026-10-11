import { ConfirmationDialog } from "@/components/Dialog";
import { toast } from "@/components/Toast";
import { localRecordStoreApi } from "../../live-record/local-record.store";
import {
  FetchChannelMeetingsDocument,
  GetCurrentUserDocument,
  GetUserMeetingsForStatusDocument,
  useDeleteMeetingsMutation,
} from "@/graphql";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import type { FC } from "react";

export const MeetingDeleteDialog: FC<{
  meeting: Meeting;
  isOpen: boolean;
  close: () => void;
  onDelete?: () => void;
  fromRef: string;
}> = ({ meeting, isOpen, close, onDelete, fromRef }) => {
  const [deleteMeeting, { loading }] = useDeleteMeetingsMutation({
    refetchQueries: [
      FetchChannelMeetingsDocument,
      GetCurrentUserDocument,
      GetUserMeetingsForStatusDocument,
    ],
    variables: {
      meetingIds: [meeting.id],
      source: `mobile-${fromRef}`,
    },
    onCompleted() {
      localRecordStoreApi.updateByMeetingId(meeting.id, {
        meetingId: undefined,
      });
      toast({
        type: "success",
        message: "Meeting has been deleted.",
      });
      close();
      onDelete?.();
    },
    onError(err) {
      toast({
        title: "Could not delete meeting",
        message: err.message,
        type: "error",
      });
    },
  });

  const onConfirm = () => {
    deleteMeeting();
  };

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      close={close}
      title="Delete Meeting"
      confirmText="Delete"
      onConfirm={onConfirm}
      loading={loading}
    >
      Are you sure you want to delete this meeting? This cannot be undone.
    </ConfirmationDialog>
  );
};
