import { IconAudioWave, IconHeadphone, IconMic } from "@/assets/svg/svgs.gen";
import type { FC } from "react";

/**
 * Device labels are the only thing the browser tells us about an input, so the
 * icon is inferred from the name. Headphones are matched first — a headset name
 * often also carries a maker or "wireless" that would otherwise read as generic.
 */
function resolveIcon(label: string) {
  const name = label.toLowerCase();
  if (/headphone|headset|airpod|earbud|buds/.test(name)) return IconHeadphone;
  if (/built-?in|internal|macbook/.test(name)) return IconAudioWave;
  return IconMic;
}

interface MicDeviceIconProps {
  label: string;
  color: string;
  size?: number;
}

export const MicDeviceIcon: FC<MicDeviceIconProps> = ({
  label,
  color,
  size = 16,
}) => {
  const Icon = resolveIcon(label);
  return <Icon width={size} height={size} color={color} />;
};
