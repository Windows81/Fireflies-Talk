import {
  IconCloudOff,
  IconDownload,
  IconPause,
  IconPlay,
  IconTrash,
  IconUploadCloud,
} from "@/assets/svg";
import { Button } from "@/components/Button";
import { ConfirmationDialog, Dialog } from "@/components/Dialog";
import { LoadingScreen } from "@/components/Loading";
import { MessageView } from "@/components/Message";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { captureException, getErrorMessage } from "@/errors";
import { usePhoneCall } from "@/features/phone-call";
import { useUpload } from "@/features/upload";
import { Logger } from "@/logger";
import { useTheme } from "@/styles";
import {
  deleteFile,
  getFileUrisInDirectory,
  getRecordingFileInfo,
  downloadWithName,
} from "@/utils/file";
import { getMimeType } from "@/utils/mime";
import { useBooleanState } from "@/utils/states";
import { toHHMMSS } from "@/utils/time";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import { format } from "date-fns";
import { useVideoPlayer, VideoView } from "expo-video";
import prettyBytes from "pretty-bytes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { RECORDING_DIRECTORY, RECORDING_FILE_EXTENSIONS } from "../constants";
import { localRecordStoreApi } from "../local-record.store";
import { useRecorder } from "../record.store";
import type { LocalRecordingFile, RecordingContext } from "../types";
import { getDownloadFileName, getFileName } from "../utils";
import {
  RecordUploadModal,
  RecordUploadModalContext,
  useRecordUploadModalContext,
} from "./RecordUploadModal";

const logger = new Logger("LocalRecordings");

const LocalRecordingContext = createContext(
  {} as {
    handleFileDelete: (file: LocalRecordingFile) => void;
    handleFileSelect: (file: LocalRecordingFile) => void;
    handleFileTogglePlay: (file: LocalRecordingFile) => void;
    currentPlayingFileUri: string | null;
  },
);

const pageSize = 20;

const now = new Date();

async function getFileInfoBatch(
  uris: string[],
  startIndex: number,
  endIndex: number,
): Promise<LocalRecordingFile[]> {
  const slice = uris.slice(startIndex, endIndex);
  const files: LocalRecordingFile[] = [];

  for (const uri of slice) {
    try {
      const ext =
        RECORDING_FILE_EXTENSIONS.find((item) =>
          uri.endsWith(item.extension),
        ) || RECORDING_FILE_EXTENSIONS[RECORDING_FILE_EXTENSIONS.length - 1];

      // Use the cross-platform utility function
      const info = await getRecordingFileInfo(uri);

      if (info) {
        files.push({
          uri,
          info,
          context: localRecordStoreApi.findByUri(uri),
          extensionInfo: ext,
        });
      }
    } catch (err) {
      captureException(err, {
        tags: {
          section: "recording-recover",
        },
      });
    }
  }

  return files;
}

const keyExtractor = (item: LocalRecordingFile) => item.uri;

const LocalRecordingFileItem: FC<{
  file: LocalRecordingFile;
}> = ({ file }) => {
  const [isOpenDeleteDialog, openDeleteDialog, closeDeleteDialog] =
    useBooleanState();

  const {
    handleFileDelete,
    handleFileSelect,
    handleFileTogglePlay,
    currentPlayingFileUri,
  } = useContext(LocalRecordingContext);

  const isPlaying = currentPlayingFileUri === file.uri;

  const { uploads } = useUpload();
  const isBeingUploaded = Boolean(
    // the includes() allows us to also consider the raw version
    // which is always in the <file>.pcm/aac format
    uploads.find((upload) => file.uri.includes(upload.fileUri)),
  );

  const fileName = getFileName(file);

  const promptRawMessage = () => {
    toast({
      title: "Raw recording format",
      message:
        "Recording is in raw format and cannot be used. Please contact support for assistance.",
    });
  };

  const togglePlay = async () => {
    if (file.extensionInfo.isRaw) {
      promptRawMessage();
      return;
    }
    handleFileTogglePlay(file);
  };

  const dateStr = useMemo(() => {
    const startTimestamp =
      file.context?.startTime || (file.info?.modificationTime || 0) * 1000;
    if (!startTimestamp) return "";

    const date = new Date(startTimestamp);

    const isSameYear = date.getFullYear() === now.getFullYear();

    return format(date, isSameYear ? "MMM d · h:mm a" : "MMM d, yyyy · h:mm a");
  }, [file.context?.startTime, file.info?.modificationTime]);

  const durationStr =
    !!file.context?.durationMillis &&
    toHHMMSS(file.context.durationMillis / 1000);

  const onUpload = () => {
    if (file.extensionInfo.isRaw) {
      promptRawMessage();
    } else {
      handleFileSelect(file);
    }
  };

  const onShareClick = () => {
    // Use download filename with .weba normalized to .webm for better compatibility
    const desiredName = getDownloadFileName(file);
    downloadWithName(file.uri, desiredName).catch((err) => {
      captureException(err, {
        tags: {
          section: "recording-recover",
        },
      });
      toast({
        title: "Failed to share recording",
        type: "error",
        message: err.message,
      });
    });
  };

  const theme = useTheme();

  const isUnuploaded = !file.context?.uploaded && !isBeingUploaded;
  const isStreamed = file.context?.streamed === true;

  return (
    <View style={styles.item}>
      {Platform.OS !== "web" && (
        <View style={styles.playWrapper}>
          <Button
            size="sm"
            Icon={isPlaying ? IconPause : IconPlay}
            aria-label={isPlaying ? "Stop" : "Play"}
            variant="outlined"
            style={styles.playIcon}
            onPress={togglePlay}
          />
          <Text variant="label3Regular" color="textMuted">
            {durationStr}
          </Text>
        </View>
      )}
      <View style={styles.contentWrapper}>
        <View style={styles.itemDetail}>
          <View style={styles.titleWrapper}>
            {isUnuploaded && !isStreamed && (
              <IconCloudOff
                color={theme.colors.commandDangerDefault}
                aria-label="Unuploaded recording"
                width={14}
                height={14}
              />
            )}
            <Text
              style={styles.title}
              variant="label1Weight"
              color="textSecondary"
            >
              {fileName}
            </Text>
          </View>
          <Text variant="label2Regular" color="textHint">
            {dateStr}
            {" · "}
            {file.info?.size ? prettyBytes(file.info.size) : "??"}{" "}
            {file.extensionInfo.extension.split(".").pop()?.toUpperCase()}
            {!!file.context?.meetingId && `\nID: ${file.context?.meetingId}`}
          </Text>
        </View>
        <View style={styles.buttons}>
          <Button
            Icon={IconUploadCloud}
            variant="transparentNeutral"
            onPress={onUpload}
            size="xs"
            disabled={isBeingUploaded}
          >
            {isBeingUploaded ? "Uploading..." : "Upload"}
          </Button>
          <Button
            Icon={IconDownload}
            variant="transparentNeutral"
            onPress={onShareClick}
            size="xs"
          >
            Save to
          </Button>
          <Button
            Icon={IconTrash}
            variant="transparentNeutral"
            disabled={isBeingUploaded}
            onPress={openDeleteDialog}
            size="xs"
          >
            Delete
          </Button>
        </View>
      </View>

      <ConfirmationDialog
        title="Delete recording"
        isOpen={isOpenDeleteDialog}
        close={closeDeleteDialog}
        onConfirm={() => handleFileDelete(file)}
        confirmText="Delete"
        cancelText="Cancel"
      >
        {`Are you sure you want to delete "${fileName}" from your device?`}
      </ConfirmationDialog>
    </View>
  );
};

const renderItem = (info: ListRenderItemInfo<LocalRecordingFile>) => {
  const file = info.item;
  return <LocalRecordingFileItem file={file} />;
};

export const LocalRecordingsList: React.FC<{
  close?: () => void;
  showOnlyUnuploaded?: boolean;
}> = ({ close, showOnlyUnuploaded = false }) => {
  const fileUrisRef = useRef<string[] | undefined>(undefined);
  const [processedFiles, setProcessedFiles] = useState<LocalRecordingFile[]>();
  const [isLoading, setIsLoading] = useState(false);
  const lastLoadedIndexRef = useRef(-1);

  const { setUploadIntent } = useRecordUploadModalContext();
  const { uploads } = useUpload();

  const loadMore = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (!fileUrisRef.current) {
        const uris = await getFileUrisInDirectory(RECORDING_DIRECTORY);

        const getTime = (uri: string) =>
          localRecordStoreApi.findByUri(uri)?.startTime ?? 0;

        // Sort all records for startTime
        fileUrisRef.current = uris.sort(
          (a, b) => getTime(b) - getTime(a) || a.localeCompare(b),
        );

        lastLoadedIndexRef.current = -1;

        logger.info("fetched local recording file uris", {
          fileCount: uris.length,
        });
      }
      const uris = fileUrisRef.current;

      if (!processedFiles && !uris.length) {
        setProcessedFiles([]);
        return;
      }
      if (!!processedFiles && processedFiles.length >= uris.length) return;

      const startIndex = lastLoadedIndexRef.current + 1;
      const endIndex = Math.min(startIndex + pageSize, uris.length);

      if (startIndex >= endIndex) return;

      const newChunk = await getFileInfoBatch(uris, startIndex, endIndex);
      lastLoadedIndexRef.current = endIndex - 1;

      const newUris = new Set(newChunk.map((file) => file.uri));

      // deduplicated by URI to prevent race conditions
      setProcessedFiles((prev) => {
        prev = prev || [];
        // Filter out existing files that are duplicated in the new chunk
        const filteredPrev = prev.filter((file) => !newUris.has(file.uri));
        return [...filteredPrev, ...newChunk].sort(
          (a, b) =>
            (b.info?.modificationTime || 0) - (a.info?.modificationTime || 0),
        );
      });
    } catch (err) {
      captureException(err, {
        tags: {
          section: "recording-recover",
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, processedFiles]);

  useEffect(() => {
    // Initial load
    if (!processedFiles) {
      loadMore();
    }
  }, [loadMore, processedFiles]);

  const handleFileDelete = useCallback(async (file: LocalRecordingFile) => {
    try {
      await deleteFile(file.uri);
      localRecordStoreApi.removeByUri(file.uri);
      setProcessedFiles((prev) => prev?.filter((f) => f.uri !== file.uri));
      fileUrisRef.current = fileUrisRef.current?.filter((u) => u !== file.uri);

      toast({ message: "Recording deleted" });
    } catch (err) {
      captureException(err, {
        tags: { section: "recording-recover" },
      });
      toast({
        title: "Delete error",
        type: "error",
        message: "Failed to delete the recording.",
      });
    }
  }, []);

  const handleFileSelect = useCallback(
    (file: LocalRecordingFile) => {
      close?.();
      const mimeType = file.context?.mimeType || getMimeType(file.uri);
      if (!mimeType) {
        toast({
          title: "Failed to upload",
          type: "error",
          message: "Unknown file type",
        });
        return;
      }

      // https://github.com/facebook/react-native/issues/47694
      setTimeout(() => {
        setUploadIntent({
          ...file.context,
          fileUri: file.uri,
          title: getFileName(file),
          usingStream: file.context?.streamed === true,
          mimeType,
        });
      }, 1000);
    },
    [close, setUploadIntent],
  );

  const [currentPlayingFile, setCurrentPlayingFile] =
    useState<LocalRecordingFile | null>(null);

  const videoPlayer = useVideoPlayer(
    useMemo(
      () => (currentPlayingFile ? { uri: currentPlayingFile.uri } : null),
      [currentPlayingFile],
    ),
    (videoPlayer) => {
      videoPlayer.play();
    },
  );

  const handleFileTogglePlay = useCallback(
    (file: LocalRecordingFile) => {
      try {
        if (currentPlayingFile?.uri !== file.uri) {
          setCurrentPlayingFile(file);
        } else {
          setCurrentPlayingFile(null);
        }
      } catch (err) {
        captureException(
          new Error(getErrorMessage(err, "RecordingRecover#togglePlay")),
          {
            tags: { section: "recording-recover" },
            contexts: {
              file: {
                ...file,
              },
            },
          },
        );
        toast({
          title: "Failed to play recording",
          type: "error",
          message:
            "The recording file might be damaged. Please contact support for assistance.",
        });
      }
    },
    [currentPlayingFile],
  );

  const renderFooter = useCallback(() => {
    if (!processedFiles?.length) return null;
    if (!isLoading) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" />
      </View>
    );
  }, [isLoading, processedFiles?.length]);

  const onRefresh = useCallback(() => {
    fileUrisRef.current = undefined;
    setProcessedFiles(undefined);
  }, []);

  const contextValue = useMemo(
    () => ({
      currentPlayingFileUri: currentPlayingFile?.uri || null,
      handleFileDelete,
      handleFileSelect,
      handleFileTogglePlay,
    }),
    [
      currentPlayingFile,
      handleFileDelete,
      handleFileSelect,
      handleFileTogglePlay,
    ],
  );

  const filteredFiles = useMemo(() => {
    if (!processedFiles || !showOnlyUnuploaded) {
      return processedFiles;
    }

    return processedFiles.filter((file) => {
      const isBeingUploaded = Boolean(
        uploads.find((upload) => file.uri.includes(upload.fileUri)),
      );
      const isUploaded = file.context?.uploaded === true;
      const isStreamed = file.context?.streamed === true;

      return !isUploaded && !isStreamed && !isBeingUploaded;
    });
  }, [processedFiles, showOnlyUnuploaded, uploads]);

  if (!processedFiles) {
    return <LoadingScreen />;
  }

  return (
    <LocalRecordingContext.Provider value={contextValue}>
      <VideoView style={{ display: "none" }} player={videoPlayer} />
      <FlashList
        data={filteredFiles}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        onRefresh={onRefresh}
        refreshing={isLoading}
        ListEmptyComponent={
          !isLoading ? (
            <View>
              <Text style={styles.emptyRecordingsText}>
                {showOnlyUnuploaded
                  ? "You don't have any unuploaded recordings."
                  : "You don't have any recordings."}
              </Text>
            </View>
          ) : null
        }
      />
    </LocalRecordingContext.Provider>
  );
};

export const LocalRecordingsDialog: FC<{
  isOpen: boolean;
  close: () => void;
  showOnlyUnuploaded?: boolean;
}> = ({ isOpen, close, showOnlyUnuploaded }) => {
  const recordingState = useRecorder((s) => s.status.state);
  const { status: callStatus } = usePhoneCall();

  const [uploadIntent, setUploadIntent] = useState<RecordingContext | null>(
    null,
  );

  return (
    <RecordUploadModalContext.Provider
      value={{ uploadIntent, setUploadIntent }}
    >
      <Dialog.Root isOpen={isOpen} close={close} variant="fullscreen">
        <Dialog.Header>Local Recordings</Dialog.Header>
        {recordingState === "inactive" || callStatus.state === "inactive" ? (
          <LocalRecordingsList
            close={close}
            showOnlyUnuploaded={showOnlyUnuploaded}
          />
        ) : (
          <MessageView
            title="Local Recordings"
            description="You can access your local recordings when you are not recording."
          />
        )}
      </Dialog.Root>
      <RecordUploadModal />
    </RecordUploadModalContext.Provider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 21,
    paddingBottom: 32,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 21,
    marginTop: 16,
  },
  itemDetail: {
    flex: 1,
  },
  playIcon: {
    borderRadius: 9999,
  },
  playWrapper: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: "column",
    gap: 8,
  },
  buttons: {
    flexDirection: "row",
    gap: 16,
  },
  titleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
  },
  emptyRecordingsText: {
    marginTop: 24,
    marginHorizontal: 24,
    textAlign: "center",
  },
  footer: {
    padding: 16,
    alignItems: "center",
  },
});
