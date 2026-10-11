import {
  IconAiExpand,
  IconBot,
  IconDownload,
  IconSparkle,
  IconVideo,
} from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import type { FC } from "react";
import { View } from "react-native";
import type { SvgProps } from "react-native-svg";

interface Benefit {
  Icon: FC<SvgProps>;
  label: string;
}

const BENEFITS: Benefit[] = [
  { Icon: IconAiExpand, label: "Unlimited Recording & AI Notes" },
  { Icon: IconVideo, label: "Record Meeting Video" },
  { Icon: IconBot, label: "AskFred – Ask anything about meetings" },
  { Icon: IconDownload, label: "Download Transcript, Audio & Video" },
  { Icon: IconSparkle, label: "AI Skills - Custom Summaries" },
];

export const PitchBenefits: FC = () => (
  <View style={styles.benefits}>
    {BENEFITS.map(({ Icon, label }) => (
      <View key={label} style={styles.benefitRow}>
        <Icon
          width={16}
          height={16}
          color={DESKTOP_THEME.grey500}
          stroke={DESKTOP_THEME.grey500}
        />
        <Text variant="body2Regular" color="textSecondary">
          {label}
        </Text>
      </View>
    ))}
  </View>
);

const styles = createStyles({
  benefits: {
    gap: 16,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
