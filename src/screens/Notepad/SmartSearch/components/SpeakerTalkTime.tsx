import { IconDot } from "@/assets/svg";
import { CircularProgress } from "@/components/CircularProgress";
import { SkeletonLoading } from "@/components/Loading";
import { Text } from "@/components/Typography";
import type { SpeakerAnalytics } from "@/graphql";
import { useTheme } from "@/styles";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";
import { WPM_STARDARD_RANGE } from "../constants";
import { styles as filterOptionsStyles } from "./FilterOptions";

export const SpeakerTalkTimeHeader: FC = () => {
  return (
    <View style={styles.header}>
      <View style={styles.speaker}>
        <Text variant="label3Regular" color="textHint">
          SPEAKER
        </Text>
      </View>
      <View style={styles.wpm}>
        <Text
          variant="label3Regular"
          color="textHint"
          style={styles.textCenter}
        >
          WPM
        </Text>
      </View>
      <View style={styles.talktime}>
        <Text
          variant="label3Regular"
          color="textHint"
          style={styles.textCenter}
        >
          TALKTIME
        </Text>
      </View>
    </View>
  );
};

export const SpeakerTalkTimeValues: FC<{
  speakerAnalytics: SpeakerAnalytics;
}> = ({ speakerAnalytics }) => {
  const wpm = Math.round(speakerAnalytics.wordsPerMinute || 0);

  const isWithinStandardRange =
    wpm >= WPM_STARDARD_RANGE.low && wpm <= WPM_STARDARD_RANGE.high;

  const durationPct = Math.round(speakerAnalytics.durationPct || 0);

  const theme = useTheme();

  return (
    <View style={styles.root}>
      <View style={[styles.col, styles.wpm]}>
        <IconDot
          color={
            theme.colors[
              isWithinStandardRange
                ? "informationStaticGreenSolid"
                : "informationStaticRedSolid"
            ]
          }
        />
        <Text variant="body3Regular" color="textMuted">
          {wpm}
        </Text>
      </View>
      <View style={[styles.col, styles.talktime]}>
        <CircularProgress size={16} value={durationPct} />
        <Text variant="body3Regular" color="textMuted">
          {durationPct.toString().padStart(2, "0")}%
        </Text>
      </View>
    </View>
  );
};

const LoadingSpeakerTalkTime: FC = () => {
  return (
    <View style={styles.loading}>
      <View style={styles.loadingLeading}>
        <SkeletonLoading width={8} height={8} />
        <SkeletonLoading width={92} height={20} />
      </View>
      <View style={styles.root}>
        <View style={[styles.col, styles.wpm]}>
          <SkeletonLoading width={42} height={20} />
        </View>
        <View style={[styles.col, styles.talktime]}>
          <SkeletonLoading width={42} height={20} />
        </View>
      </View>
    </View>
  );
};

export const loadingSpeakerTalkTimeNodes = (
  <View style={filterOptionsStyles.filterOptions}>
    <LoadingSpeakerTalkTime />
    <LoadingSpeakerTalkTime />
    <LoadingSpeakerTalkTime />
    <LoadingSpeakerTalkTime />
    <LoadingSpeakerTalkTime />
    <LoadingSpeakerTalkTime />
  </View>
);

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  header: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 12,
  },
  col: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  speaker: {
    flex: 1,
  },
  wpm: {
    width: 70,
  },
  talktime: {
    width: 60,
    gap: 4,
  },
  textCenter: {
    textAlign: "center",
  },
  loading: {
    flexDirection: "row",
    padding: 12,
    width: "100%",
  },
  loadingLeading: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
  },
});
