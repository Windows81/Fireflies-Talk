import { IconTrash } from "@/assets/svg";
import { BottomSheetMenuModal } from "@/components/BottomSheet";
import { Button } from "@/components/Button";
import { LinkView } from "@/components/Link";
import { LoadingSpinner } from "@/components/Loading";
import { MessageView } from "@/components/Message";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import type { Files } from "@/graphql";
import {
  FetchUploadedFilesDocument,
  useDeleteUserFileMutation,
} from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { formatPastRelativeTime } from "@/utils/date";
import { useBooleanState } from "@/utils/states";
import prettyBytes from "pretty-bytes";
import { useMemo, type FC } from "react";
import { Pressable, View } from "react-native";

const UserFileListItem: FC<{
  file: Files;
}> = ({ file }) => {
  const isProcessed = !file.processing;

  const href = useMemo(() => {
    if (!file.meetingId || !isProcessed) return undefined;
    return {
      pathname: "Notepad",
      params: {
        id: file.meetingId,
      },
    };
  }, [file.meetingId, isProcessed]);

  const theme = useTheme();

  const [isOpenMenu, openMenu, closeMenu] = useBooleanState();

  const [deleteUserFile] = useDeleteUserFileMutation({
    refetchQueries: [FetchUploadedFilesDocument],
    variables: {
      fileId: file._id,
    },
    onCompleted: () => {
      toast({
        type: "success",
        message: `"${file.name}" has been deleted`,
      });
    },
    onError: (err) => {
      toast({
        title: "Could not delete file",
        type: "error",
        message: err.message,
      });
    },
  });

  const node = (
    <View style={styles.item(theme)}>
      <Text variant="title3Weight">{file.name}</Text>
      <View style={styles.fileMeta}>
        {!isProcessed && <Text color="textBrand">Processing</Text>}
        <Text color="textMuted">
          {prettyBytes(file.size)} · {formatPastRelativeTime(file.createdAt)}
        </Text>
      </View>
    </View>
  );

  return (
    <>
      {href ? (
        <LinkView href={href} onLongPress={openMenu} animated>
          {node}
        </LinkView>
      ) : (
        <Pressable onLongPress={openMenu}>{node}</Pressable>
      )}
      <BottomSheetMenuModal
        isOpen={isOpenMenu}
        close={closeMenu}
        items={[
          {
            Icon: IconTrash,
            label: "Delete",
            onPress: deleteUserFile,
          },
        ]}
      />
    </>
  );
};

export const UserFileList: FC<{
  fetchUploadedFiles?: Files[] | null;
  loading: boolean;
  error?: Error;
  refetch: () => void;
}> = ({ fetchUploadedFiles, loading, error, refetch }) => {
  if (!fetchUploadedFiles && !loading && error) {
    return (
      <MessageView
        title="Could not load your uploaded files"
        description={error.message}
        action={<Button onPress={() => refetch()}>Retry</Button>}
        variant="error"
      />
    );
  }
  return (
    <View style={styles.root}>
      {loading && !fetchUploadedFiles && <LoadingSpinner />}
      {fetchUploadedFiles?.length === 0 ? (
        <Text color="textSecondary">Nothing has been uploaded</Text>
      ) : (
        fetchUploadedFiles?.map((file) => (
          <UserFileListItem key={file._id} file={file} />
        ))
      )}
    </View>
  );
};

const styles = createStyles({
  root: {
    gap: 8,
  },
  fileMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  item: (theme) => ({
    padding: 16,
    borderColor: theme.colors.borderStaticSubtle,
    borderTopWidth: 1,
    gap: 4,
  }),
});
