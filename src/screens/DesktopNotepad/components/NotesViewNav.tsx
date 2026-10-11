import { IconChevronRight } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { FC } from "react";
import { Pressable, View } from "react-native";
import { useDesktopNotepadContext } from "../DesktopNotepadContext";
import { useRowHover } from "../hooks/useRowHover";
import type { NotesView } from "../types";

const ITEMS: { key: NotesView; label: string }[] = [
  { key: "ai", label: "AI Notes" },
  { key: "my", label: "My Notes" },
];

interface Props {
  value: NotesView;
  onChange: (value: NotesView) => void;
  showNotesViewRail: boolean;
}

export const NotesViewNav: FC<Props> = ({
  value,
  onChange,
  showNotesViewRail = false,
}) => {
  const theme = useTheme();
  const { meeting } = useDesktopNotepadContext();
  const { ref, isHovered } = useRowHover();

  const handleSelect = (next: NotesView) => {
    if (next === "my" && next !== value) {
      tracker.track(TRACKING_EVENTS.NOTEPAD_TAB_CLICKED, {
        meetingId: meeting.id,
        tab: "my-notes",
      });
    }
    onChange(next);
  };

  return (
    <View ref={ref} style={[styles.rail, !showNotesViewRail && { width: 56 }]}>
      {showNotesViewRail ? (
        isHovered ? (
          <View style={styles.expanded}>
            {ITEMS.map((item) => {
              const active = item.key === value;
              const color = active
                ? theme.colors.commandContrastDefault
                : theme.colors.commandHintDefault;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => handleSelect(item.key)}
                  accessibilityRole="button"
                  style={[styles.tab, active && styles.tabActive(theme)]}
                >
                  <IconChevronRight width={16} height={16} color={color} />
                  <Text
                    variant="body3Regular"
                    numberOfLines={1}
                    style={{ color }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.compact}>
            {ITEMS.map((item) =>
              item.key === value ? (
                <View key={item.key} style={styles.tickActive(theme)} />
              ) : (
                <View key={item.key} style={styles.tickInactive(theme)}>
                  <View style={styles.tickOverlay(theme)} />
                </View>
              ),
            )}
          </View>
        )
      ) : (
        <></>
      )}
    </View>
  );
};

const RAIL_WIDTH = 56;

const styles = createStyles({
  // Full-height rail reserved to the right of the notes: hovering anywhere in
  // it expands the spy, and its width keeps the content clear of the ticks.
  rail: {
    width: RAIL_WIDTH,
    alignSelf: "stretch",
    justifyContent: "center",
    alignItems: "flex-end",
  },
  compact: {
    alignItems: "flex-end",
    gap: 8,
  },
  // Active view: bright bar with a soft white glow (design node 325:17060).
  tickActive: (theme) => ({
    width: 24,
    height: 2,
    backgroundColor: theme.colors.textPrimary,
    shadowColor: theme.colors.commandContrastDefault,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  }),
  // Inactive view: dim bar (layerStrong base with a 6% white overlay).
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
    width: 96,
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
