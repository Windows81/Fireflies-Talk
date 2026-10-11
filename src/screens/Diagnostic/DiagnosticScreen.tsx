import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { useAuth } from "@/features/auth";
import {
  localRecordStoreApi,
  RECORDING_DIRECTORY,
  useLocalRecordStore,
} from "@/features/live-record";
import { getLogFilePaths, getLogUrlMeta, Logger } from "@/logger";
import { isDesktop } from "@/utils/device";
import {
  getFileUrisInDirectory,
  shareFile,
  downloadWithName,
} from "@/utils/file";
import * as Device from "expo-device";
import * as MailComposer from "expo-mail-composer";
import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View, Platform } from "react-native";

const logger = new Logger("DiagnosticScreen");

interface Data {
  logFiles: string[];
  recordingFiles: string[];
}

const FileEntry: FC<{
  uri: string;
  selected: boolean;
  toggleFileUri: (uri: string) => void;
  showCheckbox?: boolean;
}> = ({ uri, selected, toggleFileUri, showCheckbox = true }) => {
  const name = useMemo(() => {
    if (Platform.OS === "web") {
      const meta = getLogUrlMeta(uri);
      if (meta?.filename) return meta.filename;

      // For Electron, extract filename from file path
      if (typeof window !== "undefined" && window.electron) {
        return uri.split(/[/\\]/).pop() || uri;
      }
    }
    const possibleLocalRecord = localRecordStoreApi.findByUri(uri);
    if (possibleLocalRecord?.title) {
      return possibleLocalRecord.title;
    }
    return uri.split("/").pop();
  }, [uri]);

  const handlePress = () => {
    // For Electron, open the log file in system file browser
    if (
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      window.electron?.shell
    ) {
      window.electron.shell.showItemInFolder(uri);
    } else {
      shareFile(uri);
    }
  };

  return (
    <View style={styles.entry}>
      {showCheckbox && (
        <Checkbox value={selected} onValueChange={() => toggleFileUri(uri)} />
      )}
      <Text style={styles.entryName} onLongPress={handlePress}>
        {name}
      </Text>
    </View>
  );
};

export const DiagnosticScreen: FC = () => {
  const [data, setData] = useState<Data | null>(null);

  const [selectedFileUris, setSelectedFileUris] = useState<string[]>([]);

  const toggleFileUri = (uri: string) => {
    setSelectedFileUris(
      selectedFileUris.includes(uri)
        ? selectedFileUris.filter((selectedUri) => selectedUri !== uri)
        : [...selectedFileUris, uri],
    );
  };

  useEffect(() => {
    Promise.all([
      getLogFilePaths(),
      getFileUrisInDirectory(RECORDING_DIRECTORY),
    ]).then(([logFiles, recordingFiles]) => {
      // recordingFiles from web are already newest-first; keep order
      setData({ logFiles, recordingFiles: [...recordingFiles] });
      // default to selecting all log files
      setSelectedFileUris([...logFiles]);
    });
  }, []);

  const onShare = () => {
    const deviceJson = JSON.stringify({
      brand: Device.brand,
      menufacturer: Device.manufacturer,
      modelName: Device.modelName,
      osBuildId: Device.osBuildId,
      osName: Device.osName,
      osVersion: Device.osVersion,
      platformApiLevel: Device.platformApiLevel,
      supportedCpuArchitectures: Device.supportedCpuArchitectures,
      totalMemory: Device.totalMemory,
    });

    const selectedRecordings = useLocalRecordStore
      .getState()
      .recordings.filter((recording) =>
        selectedFileUris.some((uri) => recording.fileUris.includes(uri)),
      )
      .map((recording) => ({
        title: recording.title,
        meetingId: recording.meetingId,
        startTime: recording.startTime,
        endTime: recording.endTime,
      }));
    const localRecordingJson = JSON.stringify(selectedRecordings);

    const userId = useAuth.getState().user?.id;

    MailComposer.composeAsync({
      attachments: selectedFileUris,
      subject: `Fireflies mobile app - Diagnostic information - ${userId}`,
      body: `User ID: ${userId}

Device Information:
${deviceJson}

Local Recording Store Map
${localRecordingJson}
`,
    }).catch((error) => {
      if (
        typeof error?.message === "string" &&
        error.message.includes("not available")
      ) {
        toast({
          title: "Email app not configured",
          message: "Long-press the file names to share them manually",
          duration: 10000,
          type: "info",
        });
      } else {
        toast(error.message);
      }
    });
  };

  // Electron: open logs folder
  const onOpenLogsFolder = async () => {
    if (!isDesktop) return;

    try {
      const logsDir = await window.electron!.fs.getLogsDir();
      logger.info("Opening logs folder", { logsDir });
      const result = await window.electron!.shell.openPath(logsDir);
      if (result) {
        // shell.openPath returns error string on failure, empty string on success
        logger.error("shell.openPath failed for logs", { result, logsDir });
        toast({
          title: "Failed to open folder",
          message: result,
          type: "error",
        });
      }
    } catch (error) {
      logger.error("Failed to open logs folder", {
        error: error instanceof Error ? error.message : String(error),
      });
      toast({
        title: "Failed to open folder",
        message: "Could not open the log files location",
        type: "error",
      });
    }
  };

  // Electron: open recordings folder
  const onOpenRecordingsFolder = async () => {
    if (!isDesktop) return;

    try {
      const recordingsDir = await window.electron!.fs.getRecordingsDir();
      logger.info("Opening recordings folder", { recordingsDir });
      const result = await window.electron!.shell.openPath(recordingsDir);
      if (result) {
        // shell.openPath returns error string on failure, empty string on success
        logger.error("shell.openPath failed for recordings", {
          result,
          recordingsDir,
        });
        toast({
          title: "Failed to open folder",
          message: result,
          type: "error",
        });
      }
    } catch (error) {
      logger.error("Failed to open recordings folder", {
        error: error instanceof Error ? error.message : String(error),
      });
      toast({
        title: "Failed to open folder",
        message: "Could not open the recordings location",
        type: "error",
      });
    }
  };

  const onDownload = async () => {
    if (Platform.OS !== "web") return;

    if (selectedFileUris.length === 0) {
      toast({
        title: "No files selected",
        message: "Select at least one file to download.",
      });
      return;
    }

    // Regular web browser: download files
    for (const uri of selectedFileUris) {
      try {
        const meta = getLogUrlMeta(uri);
        if (meta?.filename) {
          // Named blob URL (logs)
          await downloadWithName(uri, meta.filename);
        } else {
          // Likely a recording (fireflies://recordings/...), let web util resolve to blob URL and download
          const lr = localRecordStoreApi.findByUri(uri);
          const baseName = lr?.title || uri.split("/").pop() || "recording";
          await downloadWithName(uri, baseName);
        }
      } catch {
        try {
          window.open(uri, "_blank");
        } catch (error) {
          logger.error("Failed to download file", {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  };

  return (
    <>
      <View style={styles.body}>
        <Text variant="title2Weight" color="textSecondary">
          {isDesktop
            ? "Share log files to help troubleshoot issues."
            : "To help us diagnose your issue, please select the information you would like to share with us."}
        </Text>
        <ScrollView>
          <View style={styles.section}>
            <Text variant="label1Weight">
              Log files {data?.logFiles ? `(${data.logFiles.length})` : ""}
            </Text>
            {data?.logFiles.map((file) => (
              <FileEntry
                key={file}
                uri={file}
                selected={selectedFileUris.includes(file)}
                toggleFileUri={toggleFileUri}
                showCheckbox={!isDesktop}
              />
            ))}
          </View>
          <View style={styles.section}>
            <Text variant="label1Weight">
              Recording files{" "}
              {data?.recordingFiles ? `(${data.recordingFiles.length})` : ""}
            </Text>
            {data?.recordingFiles.map((file) => (
              <FileEntry
                key={file}
                uri={file}
                selected={selectedFileUris.includes(file)}
                toggleFileUri={toggleFileUri}
                showCheckbox={!isDesktop}
              />
            ))}
          </View>
        </ScrollView>
        {isDesktop ? (
          <View style={styles.buttonRow}>
            <Button
              onPress={onOpenLogsFolder}
              variant="secondary"
              style={styles.rowButton}
            >
              Open Logs Folder
            </Button>
            <Button
              onPress={onOpenRecordingsFolder}
              variant="secondary"
              style={styles.rowButton}
            >
              Open Recordings Folder
            </Button>
          </View>
        ) : Platform.OS === "web" ? (
          <Button onPress={onDownload} variant="primary">
            Download
          </Button>
        ) : (
          <Button onPress={onShare} variant="primary">
            Share
          </Button>
        )}
      </View>
    </>
  );
};
const styles = StyleSheet.create({
  body: {
    gap: 8,
    padding: 20,
    flex: 1,
  },
  entry: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  entryName: {
    flex: 1,
  },
  section: {
    gap: 8,
    marginVertical: 16,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  rowButton: {
    flex: 1,
  },
});
