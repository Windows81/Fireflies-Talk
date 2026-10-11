import { IconCheck, IconClose, IconTrash } from "@/assets/svg";
import { Button, useWebHover } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { type FC } from "react";
import { Pressable, View } from "react-native";

interface StopRecordingConfirmProps {
  onSave: () => void;
  onDelete: () => void;
  // Optional dismiss affordance (used on the floating pill, which has no
  // outside-click dismissal like the full-screen popover does).
  onClose?: () => void;
}

/**
 * Confirmation shown above the recording controls when the user stops a
 * recording — they can save it or discard it. Both actions close the card.
 */
export const StopRecordingConfirm: FC<StopRecordingConfirmProps> = ({
  onSave,
  onDelete,
  onClose,
}) => {
  const theme = useTheme();
  const { isHovered, webHoverProps } = useWebHover();

  return (
    <View style={styles.card(theme)}>
      {onClose && (
        <Button
          variant="transparentNeutral"
          Icon={IconClose}
          iconSize={14}
          size="xs"
          style={styles.closeButton}
          onPress={onClose}
        />
      )}
      <View style={styles.text}>
        <Text variant="heading5Weight" color="textPrimary">
          Save Recording?
        </Text>
        <Text variant="body2Regular" color="textMuted">
          Save your recording or discard. Deleted recording can&apos;t be
          recovered.
        </Text>
      </View>
      <View style={styles.buttons}>
        <Pressable
          onPress={onDelete}
          style={[
            styles.deleteButton,
            isHovered && styles.deleteButtonHover(theme),
          ]}
          accessibilityRole="button"
          accessibilityLabel="Delete recording"
          {...webHoverProps}
        >
          <IconTrash
            width={20}
            height={20}
            color={theme.colors.commandDangerDefault}
          />
          <Text variant="body2Weight" color="commandDangerDefault">
            Delete
          </Text>
        </Pressable>
        <Button variant="primary" Icon={IconCheck} onPress={onSave}>
          Save Recording
        </Button>
      </View>
    </View>
  );
};

const styles = createStyles({
  card: (theme) => ({
    position: "relative",
    width: 380,
    maxWidth: "100%",
    gap: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticDefault,
    backgroundColor: theme.colors.layerStrong,
  }),
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
    width: 28,
    height: 28,
  },
  text: {
    gap: 8,
  },
  buttons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  deleteButtonHover: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral1Default,
  }),
});
