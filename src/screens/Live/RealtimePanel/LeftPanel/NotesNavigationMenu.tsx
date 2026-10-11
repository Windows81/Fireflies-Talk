import { IconChevronRight } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { NOTES_VIEW_RAIL_WIDTH } from "@/screens/DesktopNotepad/constants";
import { useRowHover } from "@/screens/DesktopNotepad/hooks/useRowHover";
import { createStyles, useTheme } from "@/styles";
import { type FC, useCallback, useState } from "react";
import { Platform, Pressable, View } from "react-native";

export type NotesView = "my-notes" | "ai-notes" | "meeting-prep";

const ITEMS: { key: NotesView; label: string }[] = [
  { key: "my-notes", label: "My Notes" },
  { key: "ai-notes", label: "AI Notes" },
  { key: "meeting-prep", label: "Meeting Prep" },
];

export const NotesNavigationMenu: FC<{
  value: NotesView;
  onChange: (value: NotesView) => void;
}> = ({ value, onChange }) => {
  const theme = useTheme();
  const { ref, isHovered } = useRowHover();
  const [isFocused, setIsFocused] = useState(false);
  const showExpanded = isHovered || isFocused;

  const handleBlur = useCallback(() => {
    if (Platform.OS !== "web") {
      setIsFocused(false);
      return;
    }
    // Keep the menu expanded while focus moves between sibling items.
    requestAnimationFrame(() => {
      const node = ref.current as unknown as HTMLElement | null;
      if (!node?.contains(document.activeElement)) {
        setIsFocused(false);
      }
    });
  }, [ref]);

  return (
    <View ref={ref} style={styles.rail}>
      <View style={showExpanded ? styles.expanded : styles.compact}>
        {ITEMS.map((item) => {
          const active = item.key === value;
          const color = active
            ? theme.colors.commandContrastDefault
            : theme.colors.commandHintDefault;

          return (
            <Pressable
              key={item.key}
              onPress={() => onChange(item.key)}
              onFocus={() => setIsFocused(true)}
              onBlur={handleBlur}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              style={[
                showExpanded ? styles.tab : styles.compactPressable,
                showExpanded && active && styles.tabActive(theme),
              ]}
            >
              {showExpanded ? (
                <>
                  <IconChevronRight width={16} height={16} color={color} />
                  <Text
                    variant="body3Regular"
                    numberOfLines={1}
                    style={{ color }}
                  >
                    {item.label}
                  </Text>
                </>
              ) : active ? (
                <View style={styles.tickActive(theme)} />
              ) : (
                <View style={styles.tickInactive(theme)}>
                  <View style={styles.tickOverlay(theme)} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = createStyles({
  // Full-height rail reserved to the right of the notes column — mirrors the
  // notepad NotesViewNav so the spy never floats in the inter-panel gap.
  rail: {
    width: NOTES_VIEW_RAIL_WIDTH,
    alignSelf: "stretch",
    justifyContent: "center",
    alignItems: "flex-end",
  },
  compact: {
    alignItems: "flex-end",
    gap: 8,
  },
  // No vertical padding: the 8px inter-bar spacing comes solely from `compact`'s
  // gap (Figma), so the ticks aren't pushed apart by the tap target.
  compactPressable: {
    alignItems: "flex-end",
  },
  tickActive: (theme) => ({
    width: 24,
    height: 2,
    backgroundColor: theme.colors.textPrimary,
    shadowColor: theme.colors.commandContrastDefault,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  }),
  tickInactive: (theme) => ({
    width: 24,
    height: 2,
    overflow: "hidden",
    backgroundColor: theme.colors.layerStrong,
  }),
  tickOverlay: (theme) => ({
    flex: 1,
    backgroundColor: theme.colors.layerAlphaDefault,
  }),
  expanded: {
    gap: 2,
  },
  tab: {
    width: 124,
    height: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 6,
    paddingRight: 8,
    borderRadius: 4,
  },
  tabActive: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral1Default,
  }),
});
