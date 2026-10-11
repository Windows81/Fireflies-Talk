import type { FC } from "react";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

/**
 * Gmail's current mark. The one in the shared icon set is the older flat
 * envelope, which reads as a different product next to the rest of this demo.
 */
export const GmailIcon: FC<{ size?: number }> = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Defs>
      <LinearGradient
        id="gmailWing"
        x1="16.8609"
        y1="4.91504"
        x2="16.8609"
        y2="17.0457"
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#60D673" />
        <Stop offset="0.17" stopColor="#42C868" />
        <Stop offset="0.39" stopColor="#0EBC5F" />
        <Stop offset="0.62" stopColor="#00A9BB" />
        <Stop offset="0.86" stopColor="#3C90FF" />
        <Stop offset="1" stopColor="#3186FF" />
      </LinearGradient>
      <LinearGradient
        id="gmailFold"
        x1="1.25002"
        y1="5.12659"
        x2="18.75"
        y2="5.12659"
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset="0.08" stopColor="#FF63A0" />
        <Stop offset="0.3" stopColor="#FC413D" />
        <Stop offset="0.5" stopColor="#FC413D" />
        <Stop offset="0.65" stopColor="#FC413D" />
        <Stop offset="0.72" stopColor="#FC5C30" />
        <Stop offset="0.86" stopColor="#FEB10C" />
        <Stop offset="0.91" stopColor="#FEC700" />
        <Stop offset="0.96" stopColor="#FFDB0F" />
      </LinearGradient>
    </Defs>
    <Path
      d="M14.9717 4.91504H18.7501V15.8525C18.7501 16.5114 18.2158 17.0457 17.5569 17.0457H15.5683C15.41 17.0457 15.2583 16.9828 15.1464 16.871C15.0345 16.7591 14.9717 16.6073 14.9717 16.4491V4.91504Z"
      fill="url(#gmailWing)"
    />
    <Path
      d="M5.0284 4.91504H1.25V15.8525C1.25 16.5114 1.78425 17.0457 2.44318 17.0457H4.43181C4.59003 17.0457 4.74178 16.9828 4.85366 16.871C4.96554 16.7591 5.0284 16.6073 5.0284 16.4491V4.91504Z"
      fill="#FC413D"
    />
    <Path
      d="M4.35487 3.56809C3.55613 2.89673 2.36445 2.99994 1.69309 3.79868C1.02172 4.59731 1.12493 5.789 1.92367 6.46046L9.48822 12.819C9.63156 12.9395 9.8128 13.0055 10 13.0055C10.1873 13.0055 10.3685 12.9395 10.5119 12.819L18.0764 6.46036C18.8751 5.789 18.9783 4.59731 18.3069 3.79858C17.6355 2.99994 16.4439 2.89673 15.6452 3.56809L10 8.31337L4.35487 3.56809Z"
      fill="url(#gmailFold)"
    />
  </Svg>
);
