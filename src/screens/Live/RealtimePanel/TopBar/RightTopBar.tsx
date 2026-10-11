import { createStyles, useTheme } from "@/styles";
import { type FC } from "react";
import { View } from "react-native";
import { AnimatedTranscriptWaveIcon } from "../components/AnimatedTranscriptWaveIcon";
import { SegmentTabs } from "../components/SegmentTabs";
import { useIsTranscribing } from "../hooks/useIsTranscribing";
import { RIGHT_TAB, type RightTab } from "../constants";

interface RightTopBarProps {
  rightTab: RightTab;
  onChangeTab: (tab: RightTab) => void;
}

// Isolated so the live-transcript activity subscription only re-renders the
// icon, not the segmented tabs, on every incoming caption.
const TranscriptTabIndicator: FC<{ isTabActive: boolean }> = ({
  isTabActive,
}) => {
  const theme = useTheme();
  const isTranscribing = useIsTranscribing();
  const color = isTranscribing
    ? theme.colors.rainbowStaticPurpleSolid
    : isTabActive
      ? theme.colors.textSecondary
      : theme.colors.textMuted;
  return (
    <AnimatedTranscriptWaveIcon
      size={18}
      active={isTranscribing}
      color={color}
    />
  );
};

export const RightTopBar: FC<RightTopBarProps> = ({
  rightTab,
  onChangeTab,
}) => {
  return (
    <View style={styles.row}>
      <SegmentTabs<RightTab>
        value={rightTab}
        onValueChange={onChangeTab}
        items={[
          { value: RIGHT_TAB.ASK_FRED, label: "AskFred" },
          {
            value: RIGHT_TAB.TRANSCRIPT,
            label: "Transcript",
            renderTrailing: (isActive) => (
              <TranscriptTabIndicator isTabActive={isActive} />
            ),
          },
        ]}
      />
    </View>
  );
};

const styles = createStyles({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 16,
    paddingRight: 8,
    paddingBottom: 8,
    paddingLeft: 16,
  },
});
