import { useId } from "react";
import type { SvgProps } from "react-native-svg";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
const IconFred = (props: SvgProps) => {
  const id = useId();
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={`url(#${id}-a)`}
        d="m14.466 3.25.67.09-.59 4.411-.671-.09.59-4.411Z"
      />
      <Path
        fill={`url(#${id}-b)`}
        d="M13.98 2.887a.87.87 0 0 0 .914.982.867.867 0 0 0 .784-1.09.87.87 0 0 0-.723-.64.868.868 0 0 0-.976.748Z"
      />
      <Path
        fill={`url(#${id}-c)`}
        d="m10.112 7.63-.669.112-.727-4.392.668-.111.728 4.392Z"
      />
      <Path
        fill={`url(#${id}-d)`}
        d="M9.858 2.86a.871.871 0 0 1-.884 1.011.867.867 0 0 1-.818-1.065.87.87 0 0 1 1.042-.651.866.866 0 0 1 .66.704Z"
      />
      <Path
        fill={`url(#${id}-e)`}
        d="m11.913 20.292.1-.003c6.965.024 8.613-2.22 8.578-4.77a8.358 8.358 0 0 0-2.497-5.855 8.17 8.17 0 0 0-5.867-2.34l-.784.015c-1.58-.023-2.153.255-3.148.692a8.294 8.294 0 0 0-2.652 1.857 8.4 8.4 0 0 0-1.752 2.739c-.4 1.02-.599 2.108-.584 3.204.037 2.55 2.798 4.564 8.606 4.461Z"
      />
      <Path
        fill={`url(#${id}-f)`}
        d="M5.456 16.092a1.542 1.542 0 0 1-.15-.833l.005-.045a4.202 4.202 0 0 1 3.99-3.787 43.047 43.047 0 0 1 4.967.036c2.09.135 3.824 1.754 4.127 3.842l.007.046a1.5 1.5 0 0 1-.086.759.188.188 0 0 1-.006.033l-.003.018c-.237.806-1.896 1.417-3.947 1.449-.867.014-1.777.018-2.728.008a97.92 97.92 0 0 1-2.155-.042c-1.42-.041-2.668-.355-3.394-.814a1.525 1.525 0 0 1-.277-.201 1.178 1.178 0 0 1-.35-.47Z"
      />
      <Path
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={0.5}
        d="M16 15a1 1 0 1 0-2 0M10 15a1 1 0 1 0-2 0"
      />
      <Defs>
        <LinearGradient
          id={`${id}-a`}
          x1={14.801}
          x2={14.211}
          y1={3.295}
          y2={7.707}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#8E78FF" />
          <Stop offset={0.04} stopColor="#8E78FF" />
          <Stop offset={1} stopColor="#E19FFF" />
        </LinearGradient>
        <LinearGradient
          id={`${id}-b`}
          x1={14.984}
          x2={14.695}
          y1={2.144}
          y2={3.859}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#A67EE7" />
          <Stop offset={0.04} stopColor="#A87FE8" />
          <Stop offset={1} stopColor="#D699FF" />
        </LinearGradient>
        <LinearGradient
          id={`${id}-c`}
          x1={8.99}
          x2={9.727}
          y1={3.189}
          y2={8.118}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#8E78FF" />
          <Stop offset={0.04} stopColor="#8E78FF" />
          <Stop offset={1} stopColor="#E49FFF" />
        </LinearGradient>
        <LinearGradient
          id={`${id}-d`}
          x1={9.146}
          x2={8.857}
          y1={2.144}
          y2={3.86}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#A27BE5" />
          <Stop offset={0.04} stopColor="#A27BE5" />
          <Stop offset={1} stopColor="#DC9CFF" />
        </LinearGradient>
        <LinearGradient
          id={`${id}-e`}
          x1={13.308}
          x2={11.091}
          y1={7.366}
          y2={20.503}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#8E78FF" />
          <Stop offset={0.04} stopColor="#8E78FF" />
          <Stop offset={1} stopColor="#ECA3FF" />
        </LinearGradient>
        <LinearGradient
          id={`${id}-f`}
          x1={2400.21}
          x2={2401.13}
          y1={1163.92}
          y2={1158.53}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#360D44" />
          <Stop offset={1} stopColor="#3E2F75" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
};
export default IconFred;
