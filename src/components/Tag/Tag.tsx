import { IconX } from "@/assets/svg";
import { createStyles, useTheme } from "@/styles";
import { useBooleanState } from "@/utils/states";
import type { FC } from "react";
import type { AccessibilityProps, StyleProp, ViewStyle } from "react-native";
import { Pressable, TouchableOpacity, View } from "react-native";
import { Text } from "../Typography";

export interface TagProps {
  children: string;
  icon?: React.ReactNode;
  onClear?: () => void;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const Tag: FC<TagProps & AccessibilityProps> = ({
  children,
  onClear,
  onPress,
  icon,
  style,
  ...props
}) => {
  const theme = useTheme();

  const [hover, setHoverTrue, setHoverFalse] = useBooleanState();

  return (
    <>
      <View
        style={[
          styles.root(theme),
          !!icon && styles.rootWithIcon,
          hover && styles.pressed(theme),
          style,
        ]}
      >
        <Pressable
          onPress={onPress}
          onPressIn={setHoverTrue}
          onPressOut={setHoverFalse}
          onHoverIn={setHoverTrue}
          onHoverOut={setHoverFalse}
          style={styles.content}
          {...props}
        >
          {icon}
          <Text variant="body2Regular" color="commandNeutralDefault">
            {children}
          </Text>
        </Pressable>
        {onClear && (
          <TouchableOpacity
            onPress={onClear}
            aria-label={`Clear tag "${children}"`}
            role="button"
          >
            <IconX
              width={16}
              height={16}
              color={theme.colors.commandHintDefault}
            />
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};

export const styles = createStyles({
  root: (theme) => ({
    minHeight: 24,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.interactiveNeutral2Default,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
    borderRadius: 4,
    overflow: "hidden",
  }),
  rootWithIcon: {
    paddingLeft: 4,
  },
  content: {
    height: "100%",
    gap: 8,
    paddingVertical: 2,
    alignItems: "center",
    flexDirection: "row",
  },
  pressed: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Hover,
  }),
});
