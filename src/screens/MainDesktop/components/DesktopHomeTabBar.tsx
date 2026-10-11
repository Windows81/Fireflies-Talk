import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { useCallback, type FC } from "react";
import { Pressable, View } from "react-native";

export type DesktopHomeTab = "notetaker" | "dictation";

interface HomeTabButtonProps {
  isActive: boolean;
  label: string;
  showBeta: boolean;
  tab: DesktopHomeTab;
  onTabChange: (tab: DesktopHomeTab) => void;
}

interface DesktopHomeTabBarProps {
  activeTab: DesktopHomeTab;
  onTabChange: (tab: DesktopHomeTab) => void;
  /** Tabs carrying a "Beta" badge. */
  betaTabs?: DesktopHomeTab[];
}

const TABS: { key: DesktopHomeTab; label: string }[] = [
  { key: "notetaker", label: "Notetaker" },
  { key: "dictation", label: "Dictation" },
];

const HomeTabButton: FC<HomeTabButtonProps> = ({
  isActive,
  label,
  showBeta,
  tab,
  onTabChange,
}) => {
  const theme = useTheme();

  const handlePress = useCallback(() => {
    onTabChange(tab);
  }, [onTabChange, tab]);

  const tabStyle = isActive
    ? [styles.tab, styles.tabActive(theme)]
    : styles.tab;
  const labelColor = isActive ? "textPrimary" : "textMuted";
  const accessibilityLabel = showBeta ? `${label}, beta` : label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={handlePress}
      style={tabStyle}
    >
      <Text variant="body2Weight" color={labelColor}>
        {label}
      </Text>
      {showBeta && (
        <View style={styles.betaBadge}>
          <Text variant="body2Weight" style={styles.betaBadgeLabel}>
            BETA
          </Text>
        </View>
      )}
    </Pressable>
  );
};

export const DesktopHomeTabBar: FC<DesktopHomeTabBarProps> = ({
  activeTab,
  onTabChange,
  betaTabs,
}) => (
  <View style={styles.tabBar}>
    {TABS.map((tab) => (
      <HomeTabButton
        key={tab.key}
        isActive={activeTab === tab.key}
        label={tab.label}
        showBeta={!!betaTabs?.includes(tab.key)}
        tab={tab.key}
        onTabChange={onTabChange}
      />
    ))}
  </View>
);

const styles = createStyles({
  tabBar: {
    flexDirection: "row",
    gap: 2,
  },
  tab: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    cursor: "pointer",
  },
  betaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: DESKTOP_THEME.green25Badge,
  },
  betaBadgeLabel: {
    color: DESKTOP_THEME.green400Badge,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.4,
  },
  tabActive: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Hover,
  }),
});
