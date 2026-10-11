import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { Pressable, View } from "react-native";
import { useRowHover } from "../hooks/useRowHover";

interface SegmentTab<T extends string> {
  key: T;
  label: string;
  badge?: number;
}

interface SegmentTabsProps<T extends string> {
  tabs: SegmentTab<T>[];
  value: T;
  onChange: (key: T) => void;
}

interface SegmentTabButtonProps<T extends string> {
  tab: SegmentTab<T>;
  active: boolean;
  onPress: () => void;
}

function SegmentTabButton<T extends string>({
  tab,
  active,
  onPress,
}: SegmentTabButtonProps<T>) {
  const theme = useTheme();
  const { ref, isHovered } = useRowHover();

  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      style={[
        styles.tab,
        isHovered && !active && styles.tabHover(theme),
        active && styles.tabActive(theme),
      ]}
    >
      <Text
        variant="title3Weight"
        color={active ? "textSecondary" : "textMuted"}
      >
        {tab.label}
      </Text>
      {tab.badge !== undefined && (
        <View style={styles.badge}>
          <Text
            variant="body3Regular"
            style={{ color: DESKTOP_THEME.green400Badge }}
          >
            {tab.badge}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function SegmentTabs<T extends string>({
  tabs,
  value,
  onChange,
}: SegmentTabsProps<T>) {
  return (
    <View style={styles.root}>
      {tabs.map((tab) => (
        <SegmentTabButton
          key={tab.key}
          tab={tab}
          active={tab.key === value}
          onPress={() => onChange(tab.key)}
        />
      ))}
    </View>
  );
}

const styles = createStyles({
  root: {
    flexDirection: "row",
    gap: 2,
    padding: 4,
    borderRadius: 6,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tabActive: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral1Default,
  }),
  // Subtle pre-active lift for the pointer; one shade below the active fill.
  tabHover: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Hover,
  }),
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: DESKTOP_THEME.green25Badge,
  },
});
