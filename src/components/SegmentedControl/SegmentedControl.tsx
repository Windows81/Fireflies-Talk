import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { Pressable, View } from "react-native";
import { Text } from "../Typography";

const TabButton: FC<{
  label: string;
  isSelected: boolean;
  fullWidth?: boolean;
  onPress: () => void;
}> = ({ onPress, label, isSelected, fullWidth }) => {
  const theme = useTheme();

  return (
    <Pressable
      style={[
        styles.tab,
        fullWidth && styles.tabFullWidth,
        isSelected && styles.tabActive(theme),
      ]}
      onPress={onPress}
    >
      <Text
        variant="body2Weight"
        color={isSelected ? "textSecondary" : "textMuted"}
      >
        {label}
      </Text>
    </Pressable>
  );
};

export function SegmentedControl<TValue>({
  data,
  value,
  onChange,
  fullWidth,
}: {
  data: { label: string; value: TValue }[];
  value: TValue;
  onChange: (value: TValue) => void;
  fullWidth?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.tabList(theme), fullWidth && styles.tabListFullWidth]}>
      {data.map(({ label, value: tabValue }, index) => (
        <TabButton
          key={index}
          label={label}
          isSelected={tabValue === value}
          onPress={() => onChange(tabValue)}
          fullWidth={fullWidth}
        />
      ))}
    </View>
  );
}

const styles = createStyles({
  tabList: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral3Default,
    padding: 4,
    flexDirection: "row",
    alignSelf: "flex-start",
    borderRadius: 4,
  }),
  tabListFullWidth: {
    width: "100%",
  },
  tab: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 2,
    alignItems: "center",
  },
  tabFullWidth: {
    flex: 1,
  },
  tabActive: (theme) => ({
    backgroundColor: theme.colors.layerDefault,
  }),
});
