import { useState, type FC } from "react";
import { Pressable } from "react-native";
import { Text } from "@/components/Typography";
import { IconLiveNotes } from "@/assets/svg";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { openLiveNotes } from "./openLiveNotes";

interface ViewNotesButtonProps {
  /** Backend meeting id whose live notes should open. */
  meetingId?: string | null;
}

/** Opens the live notes for a meeting that is already being recorded. */
export const ViewNotesButton: FC<ViewNotesButtonProps> = ({ meetingId }) => {
  const [hovered, setHovered] = useState(false);

  const openNotes = () => {
    if (!meetingId) return;
    openLiveNotes(meetingId);
  };

  return (
    <Pressable
      onPress={openNotes}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityLabel="View Notes"
      style={[styles.button, hovered && styles.buttonHovered]}
    >
      <IconLiveNotes width={16} height={16} color={DESKTOP_THEME.grey100} />
      <Text variant="body2Weight" style={styles.label}>
        View Notes
      </Text>
    </Pressable>
  );
};

const styles = createStyles({
  button: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingLeft: 12,
    paddingRight: 16,
    paddingVertical: 8,
    borderRadius: 4,
    flexShrink: 0,
    backgroundColor: DESKTOP_THEME.purple600,
  },
  buttonHovered: {
    backgroundColor: DESKTOP_THEME.purple700,
  },
  label: {
    color: DESKTOP_THEME.grey100,
    letterSpacing: -0.16,
  },
});
