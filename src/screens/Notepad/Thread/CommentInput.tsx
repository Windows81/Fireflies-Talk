import { IconX } from "@/assets/svg";
import { Avatar } from "@/components/Avatar";
import { IconButton } from "@/components/Button";
import { TextInput } from "@/components/Input";
import { toast } from "@/components/Toast";
import { NEW_COMMENT_SOURCES } from "@/constants";
import { openLoginPopup, useAuth } from "@/features/auth";
import { useRemoteConstants } from "@/features/remote-constants";
import type { MeetingNoteComment } from "@/graphql";
import {
  MeetingNoteCommentsDocument,
  useNewMeetingNoteCommentMutation,
  useUpdateMeetingNoteCommentMutation,
} from "@/graphql";
import { createStyles } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import type { TextInput as RNTextInput } from "react-native";
import { View } from "react-native";

const CommentTextInput: FC<{
  isEditing: boolean;
  value: string;
  setValue: (value: string) => void;
  loading: boolean;
  onSubmit: () => void;
  closeEditing?: () => void;
}> = ({ isEditing, value, setValue, loading, onSubmit, closeEditing }) => {
  const { user } = useAuth();

  const inputRef = useRef<RNTextInput>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const onBlur = () => {
    if (isEditing) {
      closeEditing?.();
    }
  };

  return (
    <View style={styles.root}>
      {user && (
        <Avatar
          size={24}
          shape="square"
          name={user.name}
          picture={user.photoUrl}
        />
      )}
      <TextInput
        ref={inputRef}
        placeholder={isEditing ? "" : "Add comment"}
        variant="filled"
        value={value}
        onValueChange={setValue}
        disabled={loading}
        onSubmitEditing={onSubmit}
        returnKeyType="send"
        autoFocus={isEditing}
        onBlur={onBlur}
        style={styles.commentInput}
        submitButton
        trailing={
          !!closeEditing && (
            <IconButton
              label="Close editing"
              onPress={closeEditing}
              disabled={loading}
              Icon={IconX}
              variant="neutral"
            />
          )
        }
      />
    </View>
  );
};

export const CommentInput: FC<{
  meeting: Meeting;
  editingComment: MeetingNoteComment | null;
  setEditingComment: (comment: MeetingNoteComment | null) => void;
  setDeletingComment: (comment: MeetingNoteComment | null) => void;
}> = ({ meeting, editingComment, setEditingComment, setDeletingComment }) => {
  const [value, setValue] = useState("");
  const { DEMO_MEETING_ID } = useRemoteConstants();

  const [createNewComment, { loading }] = useNewMeetingNoteCommentMutation({
    refetchQueries: [MeetingNoteCommentsDocument],
    onCompleted({ newMeetingNoteComment }) {
      setValue("");
      tracker.track(TRACKING_EVENTS.MEETING_COMMENT_ADDED, {
        meetingId: meeting.id,
        privacy: newMeetingNoteComment?.privacy,
        isReply: Boolean(newMeetingNoteComment?.replyToCommentId),
        commentLength: newMeetingNoteComment?.comment?.length,
      });
    },
    onError(err) {
      toast({
        message: err.message,
        type: "error",
      });
    },
  });

  const { user } = useAuth();

  const onSubmit = () => {
    const commentValue = value.trim();
    if (!commentValue) return;

    if (meeting.id === DEMO_MEETING_ID) {
      toast("This action is not allowed on the sample meeting");
      return;
    }

    if (!user) {
      openLoginPopup("notepad/comment");
      return;
    }

    // TODO: allow customize privacy and timestamp
    // https://app.shortcut.com/fireflies/story/42368/add-comments-for-a-specific-timestamp
    createNewComment({
      variables: {
        meetingId: meeting.id,
        privacy: "public",
        comment: commentValue,
        source: NEW_COMMENT_SOURCES.NOTEPAD,
      },
    });
  };

  const [updateComment, { loading: loadingUpdate }] =
    useUpdateMeetingNoteCommentMutation({
      onCompleted({ updateMeetingNoteComment }) {
        setValue("");
        setEditingComment(null);
        tracker.track(TRACKING_EVENTS.MEETING_COMMENT_EDITED, {
          meetingId: meeting.id,
          privacy: updateMeetingNoteComment?.privacy,
          isReply: Boolean(updateMeetingNoteComment?.replyToCommentId),
          commentLength: updateMeetingNoteComment?.comment?.length,
        });
      },
      onError(err) {
        toast({
          title: "Could not update comment",
          message: err.message,
          type: "error",
        });
      },
    });

  const onSubmitEdit = () => {
    const commentValue = value.trim();
    if (!editingComment) return;

    if (!commentValue) {
      setDeletingComment(editingComment);
      return;
    }
    updateComment({
      variables: {
        privacy: editingComment.privacy as string,
        comment: commentValue,
        commentId: editingComment._id as string,
      },
    });
  };

  useEffect(() => {
    if (editingComment) {
      setValue(editingComment.comment || "");
    }
  }, [editingComment]);

  const closeEditing = () => {
    setEditingComment(null);
    setValue("");
  };

  return (
    <CommentTextInput
      isEditing={!!editingComment}
      closeEditing={editingComment ? closeEditing : undefined}
      loading={loading || loadingUpdate}
      onSubmit={editingComment ? onSubmitEdit : onSubmit}
      setValue={setValue}
      value={value}
    />
  );
};

const styles = createStyles({
  root: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 12,
    alignSelf: "stretch",
  },
  commentInput: {
    flex: 1,
  },
});
