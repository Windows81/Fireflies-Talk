import { IconCalendar, IconGoogleCalendar, IconOutlook } from "@/assets/svg";
import { useLiveMeetings } from "@/features/live";
import { useGetCurrentUserQuery } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { GLOBAL } from "@/styles/color";
import { useEffect, type FC } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import type { SvgProps } from "react-native-svg";

const DOT_OUTER = 14;
const DOT_MIDDLE = 10;
const DOT_INNER = 6;
const BLINK_DURATION_MS = 1800;

export const CalendarTabBarIcon: FC<SvgProps> = (props) => {
  const { data } = useGetCurrentUserQuery();
  const { liveMeetings } = useLiveMeetings();

  const isOutlook = data?.user?.profile?.isOutlook ?? false;
  const hasLiveMeeting = liveMeetings.length > 0;

  const Icon = isOutlook
    ? IconOutlook
    : data?.user
      ? IconGoogleCalendar
      : IconCalendar;

  return (
    <View style={styles.root}>
      <Icon {...props} />
      {hasLiveMeeting && <CalendarLiveDot />}
    </View>
  );
};

const CalendarLiveDot: FC = () => {
  const progress = useSharedValue(0);
  const theme = useTheme();
  const fadeColor = theme.colors.layerStrong;

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: BLINK_DURATION_MS,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );
  }, [progress]);

  const animatedInnerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [GLOBAL.red700, fadeColor],
    ),
  }));

  return (
    <View style={styles.dotOuter}>
      <View style={styles.dotMiddle}>
        <Animated.View style={[styles.dotInner, animatedInnerStyle]} />
      </View>
    </View>
  );
};

const styles = createStyles({
  root: {
    position: "relative",
  },
  dotOuter: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: DOT_OUTER,
    height: DOT_OUTER,
    borderRadius: DOT_OUTER / 2,
    backgroundColor: GLOBAL.grey25,
    alignItems: "center",
    justifyContent: "center",
  },
  dotMiddle: {
    width: DOT_MIDDLE,
    height: DOT_MIDDLE,
    borderRadius: DOT_MIDDLE / 2,
    backgroundColor: GLOBAL.red50,
    alignItems: "center",
    justifyContent: "center",
  },
  dotInner: {
    width: DOT_INNER,
    height: DOT_INNER,
    borderRadius: DOT_INNER / 2,
    backgroundColor: GLOBAL.red700,
  },
});
