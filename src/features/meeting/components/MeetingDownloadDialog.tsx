import { BottomSheetMenuModal } from "@/components/BottomSheet";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { LoadingSpinner } from "@/components/Loading";
import { Separator } from "@/components/Separator";
import { Switch } from "@/components/Switch";
import { Text } from "@/components/Typography";
import { Config } from "@/constants";
import { createStyles } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { triggerDownloadFile } from "@/utils/file";
import { isTruthy } from "@/utils/object";
import { useBooleanState } from "@/utils/states";
import {
  MeetingSummaryStatus,
  type Meeting,
} from "@firefliesai/mobile-ff.graphql-client";
import { useState, type FC } from "react";
import { View } from "react-native";
import {
  performDownload,
  generateSummaryFileName,
  generateMeetingSlug,
  type DownloadOptions,
} from "../utils/download";
import { useMeetingCapabilityGates } from "../access/useMeetingCapabilityGates";

const MeetingDownloadDialogContent: FC<{
  meeting: Meeting;
  close: () => void;
  type: "summary" | "transcript";
}> = ({ meeting, close, type }) => {
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [includeSpeaker, setIncludeSpeaker] = useState(true);
  const [includeAIApps, setIncludeAIApps] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);

  const slugTitle = generateMeetingSlug(meeting.title);

  const doDownloadTranscript = async (format: string) => {
    if (isProcessing) return;

    const options: DownloadOptions = {
      url: `${Config.DOWNLOAD_URL}/download/${format}/${slugTitle}/${meeting.id}`,
      requestBody: {
        speaker: includeSpeaker,
        timestamp: includeTimestamp,
      },
      downloadType: "transcript",
      format,
      errorTitle: "Could not download transcript",
    };

    await performDownload(options, meeting, type, setIsProcessing, close);
  };

  const doDownloadSummary = async (format: string) => {
    if (isProcessing) return;

    const fileName = generateSummaryFileName(meeting, format);
    const options: DownloadOptions = {
      url: `${Config.DOWNLOAD_URL}/summary/${format}/${meeting.id}`,
      requestBody: {
        withAIApps: includeAIApps,
        withTimestamps: includeTimestamp,
      },
      downloadType: "summary",
      format,
      errorTitle: "Could not download summary",
      fileName,
    };

    await performDownload(options, meeting, type, setIsProcessing, close);
  };

  const isTranscript = type === "transcript";
  const isSummary = type === "summary";

  return (
    <>
      <Dialog.Header>
        {isTranscript ? "Download Transcript" : "Download Summary"}
      </Dialog.Header>

      {isProcessing ? (
        <View style={styles.loading}>
          <LoadingSpinner />
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text variant="label2Regular" color="textSecondary">
              {`Select the ${type} format to download`}
            </Text>
          </View>

          {isTranscript && (
            <View style={styles.menu}>
              <Button
                variant="outlined"
                onPress={() => doDownloadTranscript("docx")}
              >
                Word (DOCX)
              </Button>
              <Button
                variant="outlined"
                onPress={() => doDownloadTranscript("pdf")}
              >
                PDF
              </Button>
              <Button
                variant="outlined"
                onPress={() => doDownloadTranscript("srt")}
              >
                SRT
              </Button>
              <Button
                variant="outlined"
                onPress={() => doDownloadTranscript("csv")}
              >
                CSV
              </Button>
              <Button
                variant="outlined"
                onPress={() => doDownloadTranscript("json")}
              >
                JSON
              </Button>
            </View>
          )}

          {isSummary && (
            <View style={styles.menu}>
              <Button
                variant="outlined"
                onPress={() => doDownloadSummary("docx")}
              >
                Word (DOCX)
              </Button>
              <Button
                variant="outlined"
                onPress={() => doDownloadSummary("pdf")}
              >
                PDF
              </Button>
              <Button
                variant="outlined"
                onPress={() => doDownloadSummary("json")}
              >
                JSON
              </Button>
              <Button
                variant="outlined"
                onPress={() => doDownloadSummary("md")}
              >
                Markdown (MD)
              </Button>
            </View>
          )}

          <Separator />
          <View style={styles.footer}>
            <View style={styles.switchControl}>
              <Switch
                value={includeTimestamp}
                onValueChange={setIncludeTimestamp}
                aria-label={`Include timestamp in ${type} download`}
              />
              <Text color="textMuted">Include timestamp</Text>
            </View>

            {isTranscript && (
              <View style={styles.switchControl}>
                <Switch
                  value={includeSpeaker}
                  onValueChange={setIncludeSpeaker}
                  aria-label="Include speakers in transcript download"
                />
                <Text color="textMuted">Include speakers</Text>
              </View>
            )}

            {isSummary && (
              <View style={styles.switchControl}>
                <Switch
                  value={includeAIApps}
                  onValueChange={setIncludeAIApps}
                  aria-label="Include AI Skills in summary download"
                />
                <Text color="textMuted">Include AI Skills</Text>
              </View>
            )}
          </View>
        </>
      )}
    </>
  );
};

export const MeetingDownloadDialog: FC<{
  meeting: Meeting;
  isOpen: boolean;
  close: () => void;
}> = ({ meeting, isOpen, close }) => {
  const [isOpenTranscript, openTranscript, closeTranscript] = useBooleanState();
  const [isOpenSummary, openSummary, closeSummary] = useBooleanState();

  const { downloadDenied, exportDenied } = useMeetingCapabilityGates(
    meeting.id,
    { download: true, export: true },
  );

  return (
    <>
      <BottomSheetMenuModal
        title="Download"
        isOpen={isOpen}
        close={close}
        items={[
          !downloadDenied &&
            !!meeting.audio_url && {
              label: "Audio",
              onPress() {
                triggerDownloadFile(meeting.audio_url as string);
                tracker.track(TRACKING_EVENTS.USER_DOWNLOADED_RECORDING, {
                  meetingId: meeting.id,
                  sourceType: "audio",
                });
              },
            },
          !downloadDenied &&
            !!meeting.video_url && {
              label: "Video",
              onPress() {
                triggerDownloadFile(meeting.video_url as string);
                tracker.track(TRACKING_EVENTS.USER_DOWNLOADED_RECORDING, {
                  meetingId: meeting.id,
                  sourceType: "video",
                });
              },
            },
          !exportDenied &&
            !!meeting.captions?.length && {
              label: "Transcript",
              onPress: openTranscript,
            },
          !exportDenied &&
            meeting.summaryStatus === MeetingSummaryStatus.Processed && {
              label: "Summary",
              onPress: openSummary,
            },
        ].filter(isTruthy)}
      />
      <Dialog.Root
        variant="basic"
        isOpen={isOpenTranscript}
        close={closeTranscript}
      >
        <MeetingDownloadDialogContent
          meeting={meeting}
          close={closeTranscript}
          type="transcript"
        />
      </Dialog.Root>
      <Dialog.Root variant="basic" isOpen={isOpenSummary} close={closeSummary}>
        <MeetingDownloadDialogContent
          meeting={meeting}
          close={closeSummary}
          type="summary"
        />
      </Dialog.Root>
    </>
  );
};

const styles = createStyles({
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  menu: {
    flexDirection: "column",
    padding: 16,
    gap: 8,
  },
  item: {},
  footer: {
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: 16,
    gap: 8,
  },
  switchControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loading: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
