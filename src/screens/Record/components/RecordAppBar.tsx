import { IconChevronDown } from "@/assets/svg";
import { IconButton } from "@/components/Button";
import { Text } from "@/components/Typography";
import { isTransitionalPhase, useRecordPhase } from "@/features/live-record";
import { createStyles, useTheme, vars } from "@/styles";
import { useAppState } from "@/utils/app-state";
import { useEffect, type FC } from "react";
import { Keyboard, Pressable, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { RecordViewSource } from "../types";
import { RecordAppBarMenu } from "./RecordAppBarMenu";

export type RecordTab = "notes" | "transcript";

const BUTTON_SIZE = 48;
const ICON_SIZE = 28;

export const RecordAppBar: FC<{
  source: RecordViewSource;
  activeTab: RecordTab;
  onTabChange: (tab: RecordTab) => void;
  onBack: () => void;
  onDiscarded?: () => void;
}> = ({ source, activeTab, onTabChange, onBack, onDiscarded }) => {
  const theme = useTheme();

  const onChevronPress = () => {
    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
      return;
    }
    onBack();
  };
  const phase = useRecordPhase();

  return (
    <View style={styles.bar}>
      <IconButton
        label={source.kind === "recorder" ? "Minimize" : "Back"}
        Icon={(props) => (
          <IconChevronDown {...props} width={ICON_SIZE} height={ICON_SIZE} />
        )}
        variant="neutralTransparent"
        onPress={onChevronPress}
        style={styles.barButton}
      />
      <View style={styles.tabsSlot}>
        {source.kind === "live-meeting" && (
          <View style={styles.tabs(theme)} role="tablist">
            <Pressable
              style={[
                styles.segment,
                activeTab === "notes" && styles.segmentActive(theme),
              ]}
              onPress={() => onTabChange("notes")}
              aria-label="Notes"
              aria-selected={activeTab === "notes"}
              role="tab"
            >
              <Text
                variant="body2Weight"
                color={activeTab === "notes" ? "textSecondary" : "textMuted"}
              >
                Notes
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.segment,
                styles.segmentTranscript,
                activeTab === "transcript" && styles.segmentActive(theme),
              ]}
              onPress={() => onTabChange("transcript")}
              aria-label="Transcript"
              aria-selected={activeTab === "transcript"}
              role="tab"
            >
              <Text
                variant="body2Weight"
                color={
                  activeTab === "transcript" ? "textSecondary" : "textMuted"
                }
              >
                Transcript
              </Text>
              <SegmentedWaveIcon />
            </Pressable>
          </View>
        )}
      </View>
      {source.kind === "recorder" && !isTransitionalPhase(phase) ? (
        <RecordAppBarMenu onDiscarded={onDiscarded} />
      ) : (
        <View style={styles.menuSpacer} />
      )}
    </View>
  );
};

const WAVE_REST_HEIGHTS = [4, 12, 6] as const;
const WAVE_ACTIVE_HEIGHTS = [10, 5, 12] as const;
const WAVE_TIMING = { duration: 600, easing: Easing.inOut(Easing.ease) };

const SegmentedWaveIcon: FC = () => {
  const theme = useTheme();
  const appState = useAppState();

  const firstBar = useSharedValue<number>(WAVE_REST_HEIGHTS[0]);
  const secondBar = useSharedValue<number>(WAVE_REST_HEIGHTS[1]);
  const thirdBar = useSharedValue<number>(WAVE_REST_HEIGHTS[2]);

  useEffect(() => {
    const heights = [firstBar, secondBar, thirdBar];
    heights.forEach(cancelAnimation);

    const animate = appState === "active";
    heights.forEach((height, i) => {
      height.value = animate
        ? withRepeat(
            withSequence(
              withTiming(WAVE_ACTIVE_HEIGHTS[i], WAVE_TIMING),
              withTiming(WAVE_REST_HEIGHTS[i], WAVE_TIMING),
            ),
            -1,
            true,
          )
        : withTiming(WAVE_REST_HEIGHTS[i], { duration: 200 });
    });
  }, [appState, firstBar, secondBar, thirdBar]);

  const barStyles = [
    useAnimatedStyle(() => ({ height: firstBar.value })),
    useAnimatedStyle(() => ({ height: secondBar.value })),
    useAnimatedStyle(() => ({ height: thirdBar.value })),
  ];

  return (
    <View style={styles.wave}>
      {barStyles.map((barStyle, i) => (
        <Animated.View key={i} style={[styles.waveBar(theme), barStyle]} />
      ))}
    </View>
  );
};

const styles = createStyles({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tabsSlot: {
    flex: 1,
    alignItems: "center",
  },
  tabs: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    padding: 4,
    borderRadius: 8,
    backgroundColor: theme.colors.layerStrong,
  }),
  segment: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentTranscript: {
    paddingRight: 10,
  },
  segmentActive: (theme) => ({
    ...vars.elevations[1],
    // Dark: interactiveNeutral1 equals the layerStrong track, hiding the active tab.
    backgroundColor:
      theme.name === "dark"
        ? theme.colors.interactiveNeutral2Default
        : theme.colors.interactiveNeutral1Default,
  }),
  barButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    margin: 4,
  },
  menuSpacer: {
    width: BUTTON_SIZE,
    margin: 4,
  },
  wave: {
    width: 20,
    height: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2.5,
  },
  waveBar: (theme) => ({
    width: 1.5,
    borderRadius: 1,
    backgroundColor: theme.colors.textMuted,
  }),
});
