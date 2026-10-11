import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import type { FC } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

export const SendButton: FC<{ enabled: boolean }> = ({ enabled }) => (
  <View
    style={[styles.button, !enabled && styles.disabled]}
    pointerEvents={enabled ? "auto" : "none"}
  >
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M7.98 16.6C8.112 16.6 8.244 16.582 8.382 16.51L16.314 12.46C16.584 12.322 16.8 12.106 16.8 11.8C16.8 11.494 16.584 11.278 16.314 11.14L8.382 7.096C8.244 7.024 8.106 7 7.98 7C7.548 7 7.2 7.342 7.2 7.852V10.51C7.2 10.816 7.428 11.032 7.728 11.038L12.15 11.35C12.396 11.356 12.6 11.554 12.6 11.8C12.6 12.046 12.396 12.244 12.15 12.25L7.728 12.562C7.428 12.568 7.2 12.784 7.2 13.09V15.754C7.2 16.264 7.548 16.6 7.98 16.6Z"
        fill={DESKTOP_THEME.grey100}
      />
    </Svg>
  </View>
);

const styles = createStyles({
  button: {
    width: 24,
    height: 24,
    borderRadius: 2.25,
    backgroundColor: DESKTOP_THEME.green650,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  disabled: {
    opacity: 0.3,
  },
});
