import type { SvgProps } from "react-native-svg";
import Svg, { Circle, Rect } from "react-native-svg";
import { vars } from "@/styles";

type IconStopSolidProps = SvgProps & {
  color?: string;
};

const IconStopSolid = ({
  color = vars.colors.red500,
  ...props
}: IconStopSolidProps) => {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle cx={12} cy={12} r={10} fill={color} />
      <Rect x={9} y={9} width={6} height={6} rx={1} fill="#fff" />
    </Svg>
  );
};

export default IconStopSolid;
