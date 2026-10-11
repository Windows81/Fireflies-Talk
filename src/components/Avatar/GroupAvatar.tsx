import { IconUserGroup } from "@/assets/svg";
import { useTheme } from "@/styles";
import { getUniqueColor } from "@/utils/color";
import { type FC } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { squareBorderRadius, styles } from "./Avatar";

export interface GroupAvatarProps {
  name: string;
  handle: string;
  size: 20 | 24 | 32 | 40 | 48;
  style?: StyleProp<ViewStyle>;
  shape?: "circle" | "square";
}

export const GroupAvatar: FC<GroupAvatarProps> = ({
  handle,
  size,
  style,
  shape = "circle",
}) => {
  const ranColor = getUniqueColor(handle || "?");
  const theme = useTheme();

  return (
    <View
      style={[
        styles.root(theme),
        shape === "circle"
          ? styles.circle
          : {
              borderRadius: squareBorderRadius[size],
            },
        {
          width: size,
          height: size,
          backgroundColor: ranColor,
          padding: 4,
        },
        style,
      ]}
      aria-hidden
    >
      <IconUserGroup color="#ffffff" width="100%" height="100%" />
    </View>
  );
};
