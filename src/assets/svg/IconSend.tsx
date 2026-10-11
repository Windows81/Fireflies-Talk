import type * as React from "react";
import Svg, { Path } from "react-native-svg";

const IconSend = ({
  color = "white",
  fill = color,
  ...props
}: React.ComponentProps<typeof Svg>) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M12 2L19 21L12 17L5 21L12 2Z"
      fill={fill}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default IconSend;
