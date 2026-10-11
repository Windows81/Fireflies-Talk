import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import type { FC } from "react";
import { Pressable, View } from "react-native";
import type { DownloadTabConfig, DownloadTabValue } from "./constants";

export const DownloadTabBar: FC<{
  tabs: DownloadTabConfig[];
  value: DownloadTabValue;
  onChange: (value: DownloadTabValue) => void;
}> = ({ tabs, value, onChange }) => {
  const theme = useTheme();
  return (
    <View style={styles.bar(theme)}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <Pressable
            key={tab.value}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(tab.value)}
          >
            <Text
              variant="label2Regular"
              color={active ? "commandPrimaryDefault" : "commandHintDefault"}
            >
              {tab.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = createStyles({
  bar: (theme) => ({
    flexDirection: "row",
    paddingLeft: 8,
    paddingRight: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderStaticSubtle,
  }),
  tab: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
    marginBottom: -1,
  },
  tabActive: {
    borderBottomColor: DESKTOP_THEME.purple500,
  },
});
