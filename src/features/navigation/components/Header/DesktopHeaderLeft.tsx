import type React from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";
import { HeaderBackButton } from "@react-navigation/elements";
import { useState } from "react";
import { createStyles, useTheme } from "@/styles";
import { useDesktopZoom } from "@/hooks/useDesktopZoom";
import { isDesktop } from "@/utils/device";

type Props = {
  canGoBack: boolean;
  onGoBack: () => void;
  tintColor?: string;
  style?: StyleProp<ViewStyle>;
};

export const DesktopHeaderLeft: React.FC<Props> = ({
  canGoBack,
  onGoBack,
  tintColor,
  style,
}) => {
  const theme = useTheme();
  const zoom = useDesktopZoom();
  const [hovered, setHovered] = useState(false);
  if (!canGoBack) return null;
  return (
    <View
      nativeID="no-drag"
      style={[styles.container, trafficLightClearance(zoom), style]}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <HeaderBackButton
        style={hovered && styles.hovered(theme)}
        tintColor={tintColor}
        onPress={onGoBack}
      />
    </View>
  );
};

const MACOS_TRAFFIC_LIGHT_MARGIN = 73;
const WINDOWS_HEADER_MARGIN = 4;
const DESKTOP_BACK_BUTTON_WIDTH = 45;

const isMac = isDesktop && window.electron?.platform === "darwin";

// The native macOS traffic lights sit at a fixed point offset that does not
// scale with the renderer zoom, while this CSS margin does. Divide by the zoom
// factor so the button's on-screen clearance stays constant at every zoom level.
const trafficLightClearance = (zoom: number): ViewStyle =>
  isMac ? { marginLeft: MACOS_TRAFFIC_LIGHT_MARGIN / zoom } : {};

const styles = createStyles({
  container: {
    marginLeft: isMac ? undefined : WINDOWS_HEADER_MARGIN,
    marginRight: 3,
    width: DESKTOP_BACK_BUTTON_WIDTH,
  },
  hovered: (theme) => ({
    width: 34,
    height: 30,
    borderRadius: 8,
    backgroundColor: theme.colors.interactiveSecondaryHover,
  }),
});
