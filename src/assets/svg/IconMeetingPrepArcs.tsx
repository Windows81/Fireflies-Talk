import type { FC } from "react";
import Svg, { Path } from "react-native-svg";
import { DESKTOP_THEME } from "@/styles/color";

/**
 * Concentric "broadcast" arcs used as the leading icon of the
 * "In the last meeting" meeting-prep banner. Shared by the desktop home prep
 * hover card and the realtime panel notes banner.
 */
export const IconMeetingPrepArcs: FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = DESKTOP_THEME.purple500,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 17 A9 9 0 0 1 21 17"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    <Path
      d="M7 17 A5 5 0 0 1 17 17"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    <Path
      d="M11 17 A1 1 0 0 1 13 17"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);
