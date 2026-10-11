import { IconAiExpand, IconAlignLeft } from "@/assets/svg";
import { HoverTooltip } from "@/components/HoverTooltip";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { Platform, Pressable, View } from "react-native";

export type NotesDockMode = "manual" | "ai";

interface NotesSubToggleDockProps {
  mode: NotesDockMode;
  onSelect: (mode: NotesDockMode) => void;
}

/**
 * Compact "_RTP / Dock" pill from the Figma "Drawer / Notes" spec — a pair
 * of icon buttons that toggle the active sub-view between the user's manual
 * notes and the AI-generated notes. Render this inline (e.g. inside a
 * footer row); positioning is the caller's responsibility.
 */
export const NotesSubToggleDock: FC<NotesSubToggleDockProps> = ({
  mode,
  onSelect,
}) => {
  const theme = useTheme();
  return (
    <View style={styles.dock(theme)} nativeID="no-drag">
      <DockButton
        isActive={mode === "manual"}
        onPress={() => onSelect("manual")}
        label="Manual Notes"
        Icon={IconAlignLeft}
      />
      <DockButton
        isActive={mode === "ai"}
        onPress={() => onSelect("ai")}
        label="AI Notes"
        Icon={IconAiExpand}
      />
    </View>
  );
};

interface DockButtonProps {
  isActive: boolean;
  onPress: () => void;
  /** Shown both as the hover tooltip and as the a11y label, so the visible
   * hint and screen-reader text stay in sync. */
  label: string;
  Icon: FC<{ width: number; height: number; color: string }>;
}

const DockButton: FC<DockButtonProps> = ({
  isActive,
  onPress,
  label,
  Icon,
}) => {
  const theme = useTheme();
  return (
    <HoverTooltip label={label} position="top" align="center">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={[styles.button, isActive && styles.buttonActive(theme)]}
      >
        <Icon width={20} height={20} color={theme.colors.textPrimary} />
      </Pressable>
    </HoverTooltip>
  );
};

const DOCK_BG = "rgba(0, 0, 0, 0.15)";

const styles = createStyles({
  dock: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    backgroundColor: DOCK_BG,
    ...(Platform.OS === "web" && { backdropFilter: "blur(40px)" }),
  }),
  button: {
    padding: 4,
    borderRadius: 4,
    cursor: "pointer",
  },
  buttonActive: (theme) => ({
    backgroundColor: theme.colors.interactiveSecondaryDefault,
  }),
});
