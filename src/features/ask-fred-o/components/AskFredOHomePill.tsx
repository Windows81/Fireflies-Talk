import { IconFred } from "@/assets/svg";
import { AnimatedPressable } from "@/components/Animated";
import { Text } from "@/components/Typography";
import { useBottomInset } from "@/constants";
import { FEATURE_FLAGS, useFeatureIsOn } from "@/features/feature-flags";
import { globalModalsApi } from "@/features/global-modals/global-modals.store";
import { useLiveMeetingsStore } from "@/features/live";
import { useIsRecordSessionActive, useRecorder } from "@/features/live-record";
import { Breakpoint, createStyles, useTheme, vars } from "@/styles";
import { GLOBAL, withAlpha } from "@/styles/color";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { isDesktop } from "@/utils/device";
import { useRecorderMargin } from "@/utils/screen-type";
import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { ASK_FRED_O_MODAL_NAME } from "../constants";
import {
  getAskFredOHomePillBottom,
  shouldShowAskFredOHomePill,
} from "../helpers/homePillLayout";
import {
  PILL_GRADIENT_COLORS,
  PILL_ICON_SIZE,
  PILL_SIDE_MARGIN,
  useAskFredOHomePillAnimation,
} from "../hooks/useAskFredOHomePillAnimation";
import { useIsAskFredOEnabled } from "../hooks/useIsAskFredOEnabled";

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

// The blur reaches this far above the bar, fading in toward it.
const BACKDROP_FADE = 14;
const BACKDROP_MASK_COLORS = [
  withAlpha(GLOBAL.black, 0),
  GLOBAL.black,
] as const;

export const AskFredOHomePill: FC<{ isExpanded: boolean }> = ({
  isExpanded,
}) => {
  const theme = useTheme();
  const isEnabled = useIsAskFredOEnabled();
  const isRealtimePanelEnabled = useFeatureIsOn(FEATURE_FLAGS.REALTIME_MEETING);
  const liveMeetings = useLiveMeetingsStore((state) => state.meetings);
  const hasActiveRecordSession = useIsRecordSessionActive();
  const hasVisibleLiveMeeting =
    !!liveMeetings[liveMeetings.length - 1]?.objectId &&
    isRealtimePanelEnabled &&
    theme.breakpoint !== Breakpoint.Large;
  // A docked floating card pins the pill collapsed on top of it, without morphing.
  const isFloatingCardVisible = hasActiveRecordSession || hasVisibleLiveMeeting;
  const isPillExpanded = isExpanded && !isFloatingCardVisible;
  const recordingState = useRecorder((state) => state.status.state);
  const streamingState = useRecorder((state) => state.status.streamingState);
  const streamingError = useRecorder((state) => state.status.streamingError);
  // While recording, MainScreen already lifts Home above the recorder card.
  const recorderMargin = useRecorderMargin({
    applyToMainRoutes: true,
    recordingState,
    streamingState,
    streamingError,
  });
  const animation = useAskFredOHomePillAnimation(
    isPillExpanded,
    !isFloatingCardVisible,
  );
  const bottom = getAskFredOHomePillBottom({
    hasTabBar: theme.breakpoint === Breakpoint.Small,
    bottomInset: useBottomInset(),
    isFloatingCardVisible: isFloatingCardVisible && !recorderMargin,
  });

  if (!shouldShowAskFredOHomePill({ isEnabled, isDesktop })) return null;

  const openAskFredO = () => {
    tracker.track(TRACKING_EVENTS.ASK_FRED_O_OPENED, {
      entrySource: "home-pill",
    });
    globalModalsApi.openModal(ASK_FRED_O_MODAL_NAME);
  };

  return (
    <View
      style={[styles.wrapper, { bottom }]}
      pointerEvents="box-none"
      onLayout={animation.onWrapperLayout}
    >
      <View style={[styles.backdrop, { bottom: -bottom }]} pointerEvents="none">
        <MaskedView
          style={StyleSheet.absoluteFill}
          maskElement={
            <View style={styles.backdropMask}>
              <LinearGradient
                colors={BACKDROP_MASK_COLORS}
                style={styles.backdropFade}
              />
              <View style={styles.backdropSolid} />
            </View>
          }
        >
          <AnimatedBlurView
            animatedProps={animation.backdropBlurProps}
            tint={theme.name === "light" ? "light" : "systemThickMaterialDark"}
            style={StyleSheet.absoluteFill}
          />
        </MaskedView>
      </View>
      <AnimatedPressable
        style={[
          vars.elevations[isPillExpanded ? 1 : 2],
          theme.name === "dark" && !isPillExpanded && styles.darkGlow(theme),
          animation.shapeStyle,
        ]}
        onPress={openAskFredO}
        accessibilityRole="button"
        accessibilityLabel="Ask Fred anything"
      >
        <Animated.View style={[styles.surface, animation.surfaceStyle]}>
          <Animated.View
            style={[StyleSheet.absoluteFill, animation.tintStyle]}
          />
          <Animated.View
            style={[StyleSheet.absoluteFill, animation.gradientStyle]}
          >
            <LinearGradient
              colors={PILL_GRADIENT_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <Animated.View style={[styles.content, animation.contentStyle]}>
            <Animated.View style={animation.iconStyle}>
              <IconFred width={PILL_ICON_SIZE} height={PILL_ICON_SIZE} />
            </Animated.View>
            <Animated.View style={animation.labelStyle}>
              <Text color="textMuted" variant="body2Regular" numberOfLines={1}>
                Ask Fred anything…
              </Text>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </AnimatedPressable>
    </View>
  );
};

const styles = createStyles({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: PILL_SIDE_MARGIN,
    // Collapsing shrinks the bar toward the bottom-right corner.
    alignItems: "flex-end",
  },
  // Blurs the feed behind and just above the bar, down to the tab bar.
  backdrop: {
    position: "absolute",
    top: -BACKDROP_FADE,
    left: 0,
    right: 0,
  },
  backdropMask: {
    flex: 1,
  },
  backdropFade: {
    height: BACKDROP_FADE,
  },
  backdropSolid: {
    flex: 1,
    backgroundColor: GLOBAL.black,
  },
  // Matches the dark Notepad AskFredButton glow.
  darkGlow: (theme) => ({
    shadowColor: theme.colors.borderInteractiveActive,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  }),
  surface: {
    flex: 1,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
