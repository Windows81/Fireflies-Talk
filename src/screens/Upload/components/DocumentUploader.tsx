import { IconPlus } from "@/assets/svg";
import { IconButton } from "@/components/Button";
import { toast } from "@/components/Toast";
import { useAuth } from "@/features/auth";
import { useBilling } from "@/features/billing";
import { openStoragePaywallModal } from "@/features/global-modals";
import { uploadFromDocument } from "@/features/upload";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { MeetingNotesPrivacy } from "@firefliesai/mobile-ff.graphql-client";
import type { FC } from "react";
import { useCallback } from "react";
import { StyleSheet } from "react-native";

export const DocumentUploaderButton: FC = () => {
  const { user } = useAuth();

  const { reachedTeamMinutesConsumedLimit } = useBilling();

  const pickDocument = useCallback(async () => {
    if (reachedTeamMinutesConsumedLimit) {
      openStoragePaywallModal("upload/header-button");

      return;
    }
    try {
      const uploadResult = await uploadFromDocument(
        {
          notesPrivacy: user?.privacy as MeetingNotesPrivacy,
        },
        {
          onError(err) {
            toast({
              type: "error",
              message: err.message,
            });
          },
        },
      );
      if (uploadResult.uploaded) {
        toast({
          message: "Upload has been started",
          duration: 6000,
        });
        tracker.track(TRACKING_EVENTS.FILE_UPLOADED, {
          from: "upload/header-button",
          mimeType: uploadResult.mimeType,
        });
      }
    } catch (err) {
      toast({
        title: "Could not upload file",
        message: err.message,
        type: "error",
      });
    }
  }, [user?.privacy, reachedTeamMinutesConsumedLimit]);

  return (
    <IconButton
      size="lg"
      Icon={IconPlus}
      label="Upload"
      hoverLabel="Upload"
      onPress={pickDocument}
      style={styles.button}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
  },
});
