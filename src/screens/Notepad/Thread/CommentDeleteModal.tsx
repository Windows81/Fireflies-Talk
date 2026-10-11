import { ConfirmationDialog } from "@/components/Dialog";
import { toast } from "@/components/Toast";
import {
  MeetingNoteCommentsDocument,
  useDeleteMeetingNoteCommentMutation,
  type MeetingNoteComment,
} from "@/graphql";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { FC } from "react";

export const CommentDeleteModal: FC<{
  comment: MeetingNoteComment | null;
  close: () => void;
  onDelete: () => void;
}> = ({ comment, close, onDelete }) => {
  const [deleteMeetingNoteComment, { loading }] =
    useDeleteMeetingNoteCommentMutation({
      refetchQueries: [MeetingNoteCommentsDocument],
      onCompleted: () => {
        onDelete();
        tracker.track(TRACKING_EVENTS.MEETING_COMMENT_DELETED, {
          meetingId: comment?.meetingId,
          privacy: comment?.privacy,
          isReply: Boolean(comment?.replyToCommentId),
          commentLength: comment?.comment?.length,
        });
      },
      onError(err) {
        toast({
          title: "Could not delete comment",
          message: err.message,
          type: "error",
        });
      },
    });

  const onConfirm = () => {
    if (!comment) return;
    deleteMeetingNoteComment({
      variables: {
        commentId: comment._id as string,
      },
    });
    close();
  };

  return (
    <ConfirmationDialog
      isOpen={Boolean(comment)}
      close={close}
      title="Delete Comment"
      confirmText="Delete"
      onConfirm={onConfirm}
      loading={loading}
    >
      Are you sure you want to delete this comment? This cannot be undone.
    </ConfirmationDialog>
  );
};
