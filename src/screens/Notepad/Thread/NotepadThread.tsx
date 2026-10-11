import { imageCommentsVisual } from "@/assets/images";
import { BottomSheetMenuModal } from "@/components/BottomSheet";
import { Button } from "@/components/Button";
import { MessageView } from "@/components/Message";
import { RefreshControl } from "@/components/RefreshControl";
import { toast } from "@/components/Toast";
import { useAuth } from "@/features/auth";
import type { MeetingNoteComment } from "@/graphql";
import { useMeetingNoteCommentsQuery } from "@/graphql";
import { copyAsText } from "@/utils/clipboard";
import { isTruthy } from "@/utils/object";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import type { FC } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import type { ListRenderItem } from "react-native";
import { FlatList, StyleSheet, View } from "react-native";
import { CommentDeleteModal } from "./CommentDeleteModal";
import { CommentInput } from "./CommentInput";
import { CommentListItem, LoadingCommentListItem } from "./CommentListItem";

const copyTextToClipboard = (text: string) => {
  copyAsText(text).then(() => {
    toast("Copied to clipboard");
  });
};

const loadingNodes = (
  <View>
    {Array.from({ length: 10 }).map((_, i) => (
      <LoadingCommentListItem key={i} />
    ))}
  </View>
);

export const NotepadThread: FC<{ meeting: Meeting }> = ({ meeting }) => {
  const ref = useRef<FlatList>(null);
  const { data, error, loading, refetch } = useMeetingNoteCommentsQuery({
    variables: {
      meetingId: meeting.id,
    },
    onCompleted(newData) {
      if (
        newData.meetingNoteComments &&
        // have at least 1 comment, excluding the ai summary
        newData.meetingNoteComments.length > 1
      ) {
        setTimeout(() => {
          ref.current?.scrollToEnd({ animated: true });
        }, 1000);
      }
    },
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  });

  const meetingNoteComments = useMemo(
    () =>
      data?.meetingNoteComments?.filter((comment) => {
        return !!comment && !comment.userId?.includes("fireflies.ai");
      }) as MeetingNoteComment[],
    [data],
  );

  const [menuComment, setMenuComment] = useState<MeetingNoteComment | null>(
    null,
  );
  const [editingComment, setEditingComment] =
    useState<MeetingNoteComment | null>(null);
  const [deletingComment, setDeletingComment] =
    useState<MeetingNoteComment | null>(null);

  const renderItem = useCallback<ListRenderItem<MeetingNoteComment>>(
    ({ item }) => (
      <CommentListItem
        key={item._id}
        comment={item}
        openMenu={setMenuComment}
        isEditing={editingComment?._id === item._id}
      />
    ),
    [setMenuComment, editingComment?._id],
  );

  const { user } = useAuth();

  return (
    <View style={styles.root}>
      <FlatList
        scrollEnabled={!loading}
        ref={ref}
        contentContainerStyle={styles.listContent}
        data={meetingNoteComments}
        renderItem={renderItem}
        ListEmptyComponent={
          loading ? (
            loadingNodes
          ) : error ? (
            <MessageView
              headerImage={imageCommentsVisual}
              title="Could not load comments"
              description={error.message}
              action={<Button onPress={() => refetch()}>Retry</Button>}
            />
          ) : (
            <MessageView
              headerImage={imageCommentsVisual}
              title="No discussion started yet"
              description="Bring your teammates, start threads and collaborate seamlessly."
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={!!data?.meetingNoteComments && loading}
            onRefresh={refetch}
          />
        }
      />
      <CommentInput
        meeting={meeting}
        editingComment={editingComment}
        setEditingComment={setEditingComment}
        setDeletingComment={setDeletingComment}
      />
      <BottomSheetMenuModal
        isOpen={Boolean(menuComment)}
        close={() => setMenuComment(null)}
        items={[
          {
            label: "Copy",
            onPress() {
              copyTextToClipboard(menuComment?.comment || "");
            },
          },
          !!user &&
            menuComment?.userId === user.notebookId && {
              label: "Edit",
              onPress() {
                setEditingComment(menuComment);
              },
            },
          !!user &&
            menuComment?.userId === user.notebookId && {
              label: "Delete",
              onPress() {
                setDeletingComment(menuComment);
              },
            },
        ].filter(isTruthy)}
      />
      <CommentDeleteModal
        comment={deletingComment}
        close={() => {
          setDeletingComment(null);
        }}
        onDelete={() => {
          // for delete flow from inside editing
          setEditingComment(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 12,
    flexDirection: "column",
    gap: 8,
  },
});
