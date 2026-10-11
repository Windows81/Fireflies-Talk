import type * as React from "react";
import Svg, {
  Defs,
  Filter,
  FeBlend,
  FeColorMatrix,
  FeComposite,
  FeFlood,
  FeGaussianBlur,
  FeOffset,
  G,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

const IconAiSparkle = (props: React.ComponentProps<typeof Svg>) => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
    <Defs>
      <Filter
        id="filter0_i"
        x={0}
        y={0}
        width={20}
        height={24}
        filterUnits="userSpaceOnUse"
      >
        <FeFlood floodOpacity={0} result="BackgroundImageFix" />
        <FeBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <FeColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <FeOffset dy={4} />
        <FeGaussianBlur stdDeviation={2} />
        <FeComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <FeColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"
        />
        <FeBlend mode="normal" in2="shape" result="effect1_innerShadow" />
      </Filter>
      <LinearGradient
        id="paint0_linear"
        x1={0.000000482473}
        y1={-0.833334}
        x2={20.8395}
        y2={18.5917}
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#53AFFF" />
        <Stop offset={1} stopColor="#6118FF" />
      </LinearGradient>
      <LinearGradient
        id="paint1_linear"
        x1={10}
        y1={5}
        x2={10}
        y2={15}
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="white" />
        <Stop offset={1} stopColor="white" stopOpacity={0} />
      </LinearGradient>
    </Defs>
    <G filter="url(#filter0_i)">
      <Path
        d="M0 6C0 2.68629 2.68629 0 6 0H14C17.3137 0 20 2.68629 20 6V16C20 18.2091 18.2091 20 16 20H6C2.68629 20 0 17.3137 0 14V6Z"
        fill="url(#paint0_linear)"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.6342 5.37611L11.8564 7.61062C11.9798 7.83588 12.1641 8.02025 12.3894 8.1436L14.6239 9.36578C15.1254 9.63998 15.1254 10.36 14.6239 10.6342L12.3894 11.8564C12.1641 11.9798 11.9798 12.1641 11.8564 12.3894L10.6342 14.6239C10.36 15.1254 9.63998 15.1254 9.36578 14.6239L8.1436 12.3894C8.02025 12.1641 7.83588 11.9798 7.61062 11.8564L5.37611 10.6342C4.87463 10.36 4.87463 9.63998 5.37611 9.36578L7.61062 8.1436C7.83588 8.02025 8.02025 7.83588 8.1436 7.61062L9.36578 5.37611C9.63998 4.87463 10.36 4.87463 10.6342 5.37611Z"
        fill="url(#paint1_linear)"
      />
    </G>
  </Svg>
);

export default IconAiSparkle;
