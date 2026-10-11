import type { FC } from "react";
import Svg, { Path } from "react-native-svg";

interface IconProps {
  color: string;
  size?: number;
}

export const PushToTalkIcon: FC<IconProps> = ({ color, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M10 6V14" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Path
      d="M13 8L13 12"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    <Path
      d="M7 8L7 12"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

export const HandsFreeIcon: FC<IconProps> = ({ color, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      d="M7.33317 16.6667V13.25L8.9165 13.4167C9.37745 13.3911 9.81367 13.2 10.145 12.8784C10.4763 12.5569 10.6804 12.1267 10.7198 11.6667V6.91669C10.7254 5.71614 10.2537 4.56257 9.40874 3.70975C8.56373 2.85693 7.41455 2.37471 6.214 2.36919C5.01346 2.36366 3.85989 2.83528 3.00707 3.68029C2.15424 4.52529 1.67203 5.67448 1.6665 6.87502C1.6665 9.20836 2.21317 9.42002 2.49984 10.6667C2.69357 11.4196 2.70187 12.2082 2.524 12.965L1.6665 16.6667"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16.5 14.8329C17.6715 13.6613 18.3299 12.0724 18.3303 10.4155C18.3308 8.75864 17.6734 7.16938 16.5025 5.99707"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.1668 12.5003C14.4395 12.2277 14.6554 11.9038 14.802 11.5472C14.9487 11.1907 15.0232 10.8086 15.0213 10.4231C15.0193 10.0375 14.941 9.6562 14.7907 9.30114C14.6405 8.94608 14.4214 8.62433 14.146 8.35449"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
