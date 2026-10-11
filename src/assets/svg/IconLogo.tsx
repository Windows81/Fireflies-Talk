import { useId } from "react";
import type { SvgProps } from "react-native-svg";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

/** The four shapes of the mark, shared by both fills so they cannot drift. */
const MARK = [
  "M7.89 0H0v7.832h7.89V0Z",
  "M17.236 9.455h-7.89v7.832h7.89V9.455Z",
  "M17.236 0h-7.89v7.832H24v-1.12c0-1.78-.713-3.487-1.981-4.746A6.788 6.788 0 0 0 17.237 0h-.001Z",
  "M0 9.455v7.832c0 1.78.713 3.488 1.981 4.747A6.789 6.789 0 0 0 6.763 24H7.89V9.455H0Z",
];

type IconLogoProps = SvgProps & {
  /**
   * Draw the mark flat in this colour instead of the brand gradient. The
   * gradient runs pink through blue, which disappears against the action
   * pill's purple — there it has to be a solid white silhouette.
   */
  solidColor?: string;
};

const IconLogo = ({ solidColor, ...props }: IconLogoProps) => {
  const id = useId();

  if (solidColor) {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
        {MARK.map((d) => (
          <Path key={d} fill={solidColor} d={d} />
        ))}
      </Svg>
    );
  }

  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path fill={`url(#${id}-a)`} d={MARK[0]} />
      <Path fill={`url(#${id}-b)`} d={MARK[1]} />
      <Path fill={`url(#${id}-c)`} d={MARK[2]} />
      <Path fill={`url(#${id}-d)`} d={MARK[3]} />
      <Path fill={`url(#${id}-e)`} d="m0 0 7.89 7.832H0V0Z" opacity={0.18} />
      <Path
        fill={`url(#${id}-f)`}
        d="m9.346 9.455 7.89 7.832h-7.89V9.455Z"
        opacity={0.18}
      />
      <Path
        fill={`url(#${id}-g)`}
        d="M0 17.287c0 1.78.713 3.488 1.981 4.747A6.789 6.789 0 0 0 6.763 24H7.89V9.455L0 17.287Z"
        opacity={0.18}
      />
      <Path
        fill={`url(#${id}-h)`}
        d="M17.237 0c1.793 0 3.513.707 4.782 1.966a6.688 6.688 0 0 1 1.98 4.747v1.119H9.347L17.236 0Z"
        opacity={0.18}
      />
      <Defs>
        <LinearGradient
          id={`${id}-a`}
          x1={19.299}
          x2={-13.867}
          y1={19.815}
          y2={-15.031}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#E82A73" />
          <Stop offset={0.113} stopColor="#DE2D7A" />
          <Stop offset={0.3} stopColor="#C5388F" />
          <Stop offset={0.54} stopColor="#9B4AB0" />
          <Stop offset={0.818} stopColor="#6262DE" />
          <Stop offset={0.994} stopColor="#3B73FF" />
        </LinearGradient>
        <LinearGradient
          id={`${id}-b`}
          x1={19.413}
          x2={-13.752}
          y1={19.707}
          y2={-15.139}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#FF3C82" />
          <Stop offset={0.103} stopColor="#F53E88" />
          <Stop offset={0.274} stopColor="#DC4598" />
          <Stop offset={0.492} stopColor="#B251B2" />
          <Stop offset={0.745} stopColor="#7961D7" />
          <Stop offset={0.994} stopColor="#3B73FF" />
        </LinearGradient>
        <LinearGradient
          id={`${id}-c`}
          x1={24.923}
          x2={13.685}
          y1={14.466}
          y2={-26.259}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#E82A73" />
          <Stop offset={0.113} stopColor="#DE2D7A" />
          <Stop offset={0.3} stopColor="#C5388F" />
          <Stop offset={0.54} stopColor="#9B4AB0" />
          <Stop offset={0.818} stopColor="#6262DE" />
          <Stop offset={0.994} stopColor="#3B73FF" />
        </LinearGradient>
        <LinearGradient
          id={`${id}-d`}
          x1={13.863}
          x2={-26.367}
          y1={24.989}
          y2={12.733}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#E82A73" />
          <Stop offset={0.113} stopColor="#DE2D7A" />
          <Stop offset={0.3} stopColor="#C5388F" />
          <Stop offset={0.54} stopColor="#9B4AB0" />
          <Stop offset={0.818} stopColor="#6262DE" />
          <Stop offset={0.994} stopColor="#3B73FF" />
        </LinearGradient>
        <LinearGradient
          id={`${id}-e`}
          x1={-3.858}
          x2={7.41}
          y1={-9.782}
          y2={16.038}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#E82A73" />
          <Stop offset={0.114} stopColor="#DE286E" />
          <Stop offset={0.303} stopColor="#C52361" />
          <Stop offset={0.544} stopColor="#9B1A4D" />
          <Stop offset={0.825} stopColor="#620F30" />
          <Stop offset={0.994} stopColor="#3D081E" />
        </LinearGradient>
        <LinearGradient
          id={`${id}-f`}
          x1={5.488}
          x2={16.756}
          y1={-0.327}
          y2={25.494}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#E82A73" />
          <Stop offset={0.114} stopColor="#DE286E" />
          <Stop offset={0.303} stopColor="#C52361" />
          <Stop offset={0.544} stopColor="#9B1A4D" />
          <Stop offset={0.825} stopColor="#620F30" />
          <Stop offset={0.994} stopColor="#3D081E" />
        </LinearGradient>
        <LinearGradient
          id={`${id}-g`}
          x1={-2.619}
          x2={22.901}
          y1={-0.741}
          y2={16.213}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#E82A73" />
          <Stop offset={0.114} stopColor="#DE286E" />
          <Stop offset={0.303} stopColor="#C52361" />
          <Stop offset={0.544} stopColor="#9B1A4D" />
          <Stop offset={0.825} stopColor="#620F30" />
          <Stop offset={0.994} stopColor="#3D081E" />
        </LinearGradient>
        <LinearGradient
          id={`${id}-h`}
          x1={-558.666}
          x2={-554.293}
          y1={551.006}
          y2={585.533}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#E82A73" />
          <Stop offset={0.114} stopColor="#DE286E" />
          <Stop offset={0.303} stopColor="#C52361" />
          <Stop offset={0.544} stopColor="#9B1A4D" />
          <Stop offset={0.825} stopColor="#620F30" />
          <Stop offset={0.994} stopColor="#3D081E" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
};

export default IconLogo;
