import type * as React from "react";
import Svg, { Path } from "react-native-svg";

const IconWindows = (props: React.ComponentProps<typeof Svg>) => (
  <Svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <Path d="M3 3h8.5v8.5H3ZM12.5 3H21v8.5h-8.5ZM3 12.5h8.5V21H3ZM12.5 12.5H21V21h-8.5Z" />
  </Svg>
);

export default IconWindows;
