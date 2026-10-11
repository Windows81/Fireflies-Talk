import { IconAlertCircle } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { SelectField, TextField } from "@/components/Input";
import { LoadingSpinner } from "@/components/Loading";
import { MessageView } from "@/components/Message";
import { toast } from "@/components/Toast";
import { captureException } from "@/errors";
import { Logger } from "@/logger";
import * as ShareTarget from "@/modules/share-target";
import { RootNavigation } from "@/screens/RootNavigation";
import { useTheme } from "@/styles";
import { tracker, TRACKING_EVENTS } from "@/tracking";
import { MeetingNotesPrivacy } from "@firefliesai/mobile-ff.graphql-client";
import { useCallback, useEffect, useState, type FC } from "react";
import { StyleSheet, View } from "react-native";
import { useAuth } from "../auth";
import { useBilling } from "../billing";
import { openStoragePaywallModal } from "../global-modals";
import { useMeetingPrivacyOptions } from "../meeting";
import { resolveAllowedMeetingPrivacy } from "../meeting/utils/meeting-privacy-options";
import {
  createMeetingForUpload,
  UPLOAD_CLIENT_KEYS,
  uploadApi,
  useUpload,
} from "../upload";
import { isDesktop } from "@/utils/device";

interface SharedFileInfo {
  name: string;
  mimeType: string;
  size: number;
  uri: string;
}

const logger = new Logger("share-target");

const ShareTargetUploadableMediaForm: FC<{
  info: SharedFileInfo;
  close: () => void;
}> = ({ info, close }) => {
  const { user } = useAuth();
  const privacyOptions = useMeetingPrivacyOptions();

  const [title, setTitle] = useState(() => decodeURIComponent(info.name) || "");

  const [privacy, setPrivacy] = useState<MeetingNotesPrivacy>(
    (user?.privacy || MeetingNotesPrivacy.Link) as MeetingNotesPrivacy,
  );
  const effectivePrivacy =
    resolveAllowedMeetingPrivacy(privacy, privacyOptions) ?? privacy;

  const isValid = title.trim().length > 0;

  const [loading, setLoading] = useState(false);

  const doUpload = useCallback(async () => {
    // copy file to cache
    if (loading) return;
    setLoading(true);
    try {
      const meeting = await createMeetingForUpload({
        title,
        notesPrivacy: effectivePrivacy,
        client: isDesktop
          ? UPLOAD_CLIENT_KEYS.DESKTOP_SHARED
          : UPLOAD_CLIENT_KEYS.MOBILE_SHARED,
      });

      const fileUri = info.uri;

      await uploadApi.create(
        {
          uri: fileUri,
          mimeType: info.mimeType,
          size: info.size,
        },
        {
          meetingId: meeting.id,
          title,
          onError(err) {
            toast({
              title: "Could not upload file",
              message: err.message,
              type: "error",
            });
          },
          onCompleted() {
            if (
              !useUpload
                .getState()
                .uploads.some((u) => u.status !== "completed")
            ) {
              // all uploads are completed, cleanup
              logger.info("share data cleaning up");
              ShareTarget.cleanup();
            }
          },
        },
      );

      toast({
        message: "Upload has been started",
        duration: 6000,
        action: {
          label: "View",
          onPress() {
            RootNavigation.navigate("Upload");
          },
        },
      });

      tracker.track(TRACKING_EVENTS.FILE_UPLOADED, {
        from: "shared",
      });

      close();
    } catch (err) {
      toast({
        title: "Something when wrong while uploading shared file",
        message: err.message,
        type: "error",
      });

      captureException(err, {
        contexts: {
          info: { ...info },
        },
        tags: {
          section: "share-target",
        },
      });
    } finally {
      setLoading(false);
    }
  }, [loading, info, title, effectivePrivacy, close]);

  return (
    <>
      <View style={styles.content}>
        <TextField label="Name" value={title} onValueChange={setTitle} />
        <SelectField
          label="Privacy"
          value={effectivePrivacy}
          onValueChange={setPrivacy}
          options={privacyOptions}
        />
      </View>
      <Dialog.Actions>
        <Button
          variant="secondary"
          onPress={close}
          style={styles.button}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          style={styles.button}
          disabled={!isValid || loading}
          onPress={doUpload}
        >
          Upload
        </Button>
      </Dialog.Actions>
    </>
  );
};

export const ShareTargetUploadableMedia: FC<{
  file: ShareTarget.ShareFile;
  close: () => void;
}> = ({ file, close }) => {
  const [info, setInfo] = useState<null | SharedFileInfo>(null);

  const [error, setError] = useState<null | Error>(null);

  const { reachedTeamMinutesConsumedLimit } = useBilling();

  useEffect(() => {
    if (
      file.name &&
      typeof file.size === "number" &&
      typeof file.type === "string"
    ) {
      setInfo({
        name: file.name,
        mimeType: file.type,
        size: file.size,
        uri: file.uri,
      });
    } else {
      const err = new Error(
        "Shared file does not contain enough information and may not be supported",
      );
      captureException(err, {
        contexts: {
          file,
        },
        tags: {
          section: "share-target",
        },
      });
      setError(err);
    }
  }, [file]);

  useEffect(() => {
    if (info && reachedTeamMinutesConsumedLimit) {
      close();
      openStoragePaywallModal("shared");
    }
  }, [info, close, reachedTeamMinutesConsumedLimit]);

  const theme = useTheme();

  return (
    <>
      <Dialog.Header>Upload audio/video</Dialog.Header>
      <View style={styles.root}>
        {info ? (
          <ShareTargetUploadableMediaForm info={info} close={close} />
        ) : error ? (
          <MessageView
            header={<IconAlertCircle color={theme.colors.textSecondary} />}
            title="Could not upload this file"
            description={error.message}
          />
        ) : (
          <View style={styles.loading}>
            <LoadingSpinner />
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  root: {
    paddingTop: 24,
    minHeight: 200,
  },
  content: {
    paddingHorizontal: 24,
    gap: 16,
  },
  button: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
