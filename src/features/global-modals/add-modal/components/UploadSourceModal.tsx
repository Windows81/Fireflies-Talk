import { IconMediaLibrary, IconFileText, IconAudioWave } from "@/assets/svg";
import { Dialog } from "@/components/Dialog";
import { Text } from "@/components/Typography";
import { useTheme } from "@/styles";
import { useCallback, useRef, type FC } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { pickDocument } from "./pickDocument";
import { pickGallery } from "./pickGallery";
import { TRACKING_EVENTS, tracker } from "@/tracking";

const uploadSourceButtons = [
  {
    label: "Select video from gallery",
    icon: IconMediaLibrary,
    action: "gallery" as const,
  },
  {
    label: "Select audio",
    icon: IconAudioWave,
    action: "audio" as const,
  },
  {
    label: "Select from files",
    icon: IconFileText,
    action: "documents" as const,
  },
];

export const UploadSourceModal: FC<{
  isOpen: boolean;
  close: () => void;
}> = ({ isOpen, close }) => {
  const theme = useTheme();
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handlePress = useCallback(
    (action: "gallery" | "documents" | "audio") => {
      close();
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (action === "gallery") {
          pickGallery();
          tracker.track(TRACKING_EVENTS.DOCUMENT_PICKER_OPENED, {
            from: "home/add-button/gallery",
          });
        } else if (action === "audio") {
          pickDocument({ mimeType: "audio/*" });
          tracker.track(TRACKING_EVENTS.DOCUMENT_PICKER_OPENED, {
            from: "home/add-button/audio",
          });
        } else {
          pickDocument();
          tracker.track(TRACKING_EVENTS.DOCUMENT_PICKER_OPENED, {
            from: "home/add-button/documents",
          });
        }
      }, 500);
    },
    [close],
  );

  return (
    <Dialog.Root isOpen={isOpen} close={close} variant="bottomSheet">
      <Dialog.Header>Upload Audio or Video</Dialog.Header>
      <View style={styles.root}>
        {uploadSourceButtons.map((button) => (
          <TouchableOpacity
            key={button.action}
            style={[
              styles.button,
              { backgroundColor: theme.colors.layerMuted },
            ]}
            onPress={() => handlePress(button.action)}
            role="button"
          >
            <button.icon
              color={theme.colors.textSecondary}
              width={20}
              height={20}
            />
            <Text color="textSecondary">{button.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Dialog.Root>
  );
};

const styles = StyleSheet.create({
  root: {
    gap: 8,
    padding: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
    width: "100%",
  },
});
