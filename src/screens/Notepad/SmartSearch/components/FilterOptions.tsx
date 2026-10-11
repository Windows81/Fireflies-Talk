import { IconCheck, IconDot } from "@/assets/svg";
import { Avatar, type AvatarProps } from "@/components/Avatar";
import { Text } from "@/components/Typography";
import type { RainbowColor, Theme } from "@/styles";
import { createStyles, useTheme } from "@/styles";
import type { ReactNode } from "react";
import { type FC } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, View } from "react-native";

export interface FilterOptionProps {
  key: string;
  selected: boolean;
  avatar?: Pick<AvatarProps, "name" | "picture">;
  label: {
    left: string;
    right: string | ReactNode;
  };
  onPress: () => void;
  color?: RainbowColor;
}

const FilterOption: FC<
  FilterOptionProps & { style?: StyleProp<ViewStyle>; numColumn: number }
> = ({ selected, label, numColumn, onPress, color, avatar }) => {
  const theme = useTheme();

  const textColor: keyof Theme["colors"] = selected
    ? color
      ? `rainbowStatic${color}Text`
      : "textBrand"
    : "textSecondary";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.filterOption(theme),
        pressed && styles.filterOptionPressed(theme),
        selected && {
          backgroundColor: color
            ? theme.colors[`rainbowStatic${color}Subtle`]
            : theme.colors.layerBrandLight2,
        },
        getColumnStyle(numColumn),
      ]}
      onPress={onPress}
      role="checkbox"
      aria-checked={selected}
    >
      <View style={styles.filterOptionLeft}>
        {avatar ? (
          <Avatar size={20} {...avatar} shape="square" />
        ) : selected ? (
          <IconCheck color={theme.colors[textColor]} width={20} height={20} />
        ) : (
          <IconDot
            width={20}
            height={20}
            color={
              color
                ? theme.colors[`rainbowInteractive${color}Default`]
                : textColor
            }
          />
        )}
        <Text variant="body3Regular" color={textColor}>
          {label.left}
        </Text>
      </View>
      <View style={styles.filterOptionRight}>
        {typeof label.right === "string" ? (
          <Text variant="body3Regular" color={textColor}>
            {label.right}
          </Text>
        ) : (
          label.right
        )}
      </View>
    </Pressable>
  );
};

export const FilterOptions: FC<{
  numColumn: number;
  options: FilterOptionProps[];
}> = ({ numColumn, options }) => {
  return (
    <View style={styles.filterOptions}>
      {options.map((option) => (
        <FilterOption {...option} key={option.key} numColumn={numColumn} />
      ))}
    </View>
  );
};

export const getColumnStyle = (numColumn: number): ViewStyle => ({
  width: numColumn > 1 ? `${95 / numColumn}%` : "100%",
});

export const styles = createStyles({
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterOption: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
    borderRadius: 4,
    backgroundColor: theme.colors.interactiveNeutral2Default,
  }),
  filterOptionPressed: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Hover,
  }),
  filterOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  filterOptionRight: {
    flexDirection: "row",
    alignItems: "center",
  },
});
