import { Text } from "@/components/Typography";
import {
  describeMilestoneProgress,
  getMilestoneProgress,
} from "@/hooks/dictationStats";
import { createStyles } from "@/styles";
import { DESKTOP_THEME, withAlpha } from "@/styles/color";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState, type FC } from "react";
import { Animated, Easing, View } from "react-native";

/** One pass of the sheen, then a beat of rest before it comes round again. */
const SHEEN_TRAVEL_MS = 1_400;
const SHEEN_REST_MS = 2_600;
const SHEEN_WIDTH = 56;

const SHEEN_COLORS = [
  withAlpha(DESKTOP_THEME.grey100, 0),
  withAlpha(DESKTOP_THEME.grey100, 0.65),
  withAlpha(DESKTOP_THEME.grey100, 0),
] as const;

/**
 * A light travelling the length of the filled bar, the way a highlight runs
 * across polished metal. Rests between passes so it reads as a sheen rather
 * than a loading stripe.
 */
const Sheen: FC<{ width: number }> = ({ width }) => {
  const travel = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!width) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(travel, {
          toValue: 1,
          duration: SHEEN_TRAVEL_MS,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(SHEEN_REST_MS),
        Animated.timing(travel, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [travel, width]);

  const translateX = travel.interpolate({
    inputRange: [0, 1],
    outputRange: [-SHEEN_WIDTH, width],
  });

  return (
    <Animated.View
      style={[styles.sheen, { transform: [{ translateX }] }]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={SHEEN_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.sheenFill}
      />
    </Animated.View>
  );
};

/**
 * How far through the next milestone the user is: a bar, and the same figure
 * in words. Only the milestone being worked toward is named — the ones above
 * it stay unseen, so the ladder reveals itself as they climb. The bar stands
 * alone before the first percent is earned, where naming a milestone would
 * only say the user has none of it.
 */
export const DictationMilestones: FC<{ totalWords: number }> = ({
  totalWords,
}) => {
  const [fillWidth, setFillWidth] = useState(0);

  const { label, percent } = useMemo(
    () => ({
      label: describeMilestoneProgress(totalWords),
      percent: Math.min(
        100,
        Math.round(getMilestoneProgress(totalWords).progress * 100),
      ),
    }),
    [totalWords],
  );

  return (
    <View style={styles.stacked}>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${percent}%` }]}
          onLayout={(event) => setFillWidth(event.nativeEvent.layout.width)}
        >
          <Sheen width={fillWidth} />
        </View>
      </View>

      {label ? (
        <Text variant="body2Regular" color="textHint">
          {label}
        </Text>
      ) : null}
    </View>
  );
};

const styles = createStyles({
  stacked: {
    gap: 12,
    alignSelf: "stretch",
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: withAlpha(DESKTOP_THEME.grey500, 0.15),
    overflow: "hidden",
  },
  // Clips the sheen, so the light only ever runs over what has been earned.
  fill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: DESKTOP_THEME.purple500,
    overflow: "hidden",
  },
  sheen: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: SHEEN_WIDTH,
  },
  sheenFill: {
    flex: 1,
  },
});
