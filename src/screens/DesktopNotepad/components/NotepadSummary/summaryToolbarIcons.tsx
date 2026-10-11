import type { FC, ReactNode } from "react";
import Svg, { Line, Path } from "react-native-svg";

interface IconProps {
  size?: number;
  color: string;
}

const stroke = (color: string) => ({
  stroke: color,
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
});

const Base: FC<{ size?: number; children: ReactNode }> = ({
  size = 20,
  children,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    {children}
  </Svg>
);

export const IconListBullet: FC<IconProps> = ({ size, color }) => (
  <Base size={size}>
    <Line x1="8" y1="6" x2="21" y2="6" {...stroke(color)} />
    <Line x1="8" y1="12" x2="21" y2="12" {...stroke(color)} />
    <Line x1="8" y1="18" x2="21" y2="18" {...stroke(color)} />
    <Line x1="3" y1="6" x2="3.01" y2="6" {...stroke(color)} />
    <Line x1="3" y1="12" x2="3.01" y2="12" {...stroke(color)} />
    <Line x1="3" y1="18" x2="3.01" y2="18" {...stroke(color)} />
  </Base>
);

export const IconListOrdered: FC<IconProps> = ({ size, color }) => (
  <Base size={size}>
    <Line x1="10" y1="6" x2="21" y2="6" {...stroke(color)} />
    <Line x1="10" y1="12" x2="21" y2="12" {...stroke(color)} />
    <Line x1="10" y1="18" x2="21" y2="18" {...stroke(color)} />
    <Path d="M4 6h1v4" {...stroke(color)} />
    <Path d="M4 10h2" {...stroke(color)} />
    <Path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" {...stroke(color)} />
  </Base>
);
