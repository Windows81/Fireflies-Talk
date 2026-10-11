import { IconCheck, IconRefreshCcw, IconX } from "@/assets/svg";
import { ConfirmationDialog } from "@/components/Dialog";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import type { UploadTaskDetail } from "@/features/upload";
import { uploadApi } from "@/features/upload";
import { createStyles, useTheme } from "@/styles";
import { useBooleanState } from "@/utils/states";
import prettyBytes from "pretty-bytes";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const UploadingFileListItem: FC<{ task: UploadTaskDetail }> = ({ task }) => {
  const [progress, setProgress] = useState(0);

  const animPercentage = useSharedValue(0);

  useEffect(() => {
    const itv = setInterval(() => {
      const nextProgress =
        task.progress.totalBytesSent / task.progress.totalBytesExpectedToSend;
      setProgress(nextProgress);
      animPercentage.value = withTiming(Math.round(nextProgress * 100));
    }, 1000);
    return () => {
      clearInterval(itv);
    };
  }, [task, animPercentage]);

  const theme = useTheme();

  const animStyle = useAnimatedStyle(
    () => ({
      width: `${animPercentage.value}%`,
    }),
    [],
  );

  const [isOpenCancel, openCancel, closeCancel] = useBooleanState();

  const onRetry = () => {
    uploadApi.retry(task).catch((err) => {
      toast({
        title: `Failed to retry upload "${task.title}"`,
        message: err.message,
        type: "error",
      });
    });
  };

  return (
    <>
      <View style={styles.item(theme)}>
        <Animated.View
          style={[
            styles.progressBackdrop,
            { backgroundColor: theme.colors.layerBrandLight2 },
            animStyle,
          ]}
        />
        <View style={styles.itemContent}>
          <Text fontWeight="500" numberOfLines={1}>
            {task.title}
          </Text>
          {task.status === "failed" ? (
            <Text color="informationStaticRedText">Failed</Text>
          ) : (
            <Text color="textMuted">
              {prettyBytes(task.progress.totalBytesExpectedToSend)}
              {" · "}
              {Math.ceil(progress * 100)}%
            </Text>
          )}
        </View>

        {task.status === "failed" && (
          <TouchableOpacity
            aria-label="Retry upload"
            style={styles.cancel}
            onPress={onRetry}
            role="button"
          >
            <IconRefreshCcw
              color={theme.colors.textMuted}
              width={18}
              height={18}
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          aria-label="Cancel upload"
          style={styles.cancel}
          onPress={openCancel}
          role="button"
        >
          {task.status !== "completed" ? (
            <IconX color={theme.colors.textMuted} width={21} height={21} />
          ) : (
            <IconCheck color="rgb(55, 179, 78)" width={24} height={24} />
          )}
        </TouchableOpacity>
      </View>
      <ConfirmationDialog
        isOpen={isOpenCancel && task.status !== "completed"}
        close={closeCancel}
        title={`Remove upload "${task.title}"`}
        confirmText="Remove upload"
        onConfirm={() => {
          uploadApi.cancel(task);
          toast({
            message: `Upload "${task.title}" has been removed`,
            type: "info",
          });
        }}
      >
        Are you sure you want to remove this upload? This cannot be undone.
      </ConfirmationDialog>
    </>
  );
};

export const UploadingFileList: FC<{
  uploadTasks: UploadTaskDetail[];
}> = ({ uploadTasks }) => {
  return (
    <View style={styles.root}>
      {uploadTasks.map((task) => (
        <UploadingFileListItem key={task.id} task={task} />
      ))}
    </View>
  );
};

const styles = createStyles({
  root: {
    gap: 8,
  },
  item: (theme) => ({
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderColor: theme.colors.borderStaticSubtle,
    borderTopWidth: 1,
  }),
  itemContent: {
    padding: 16,
    gap: 4,
    flex: 1,
  },
  progressBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
  },
  cancel: {
    padding: 10,
  },
});
