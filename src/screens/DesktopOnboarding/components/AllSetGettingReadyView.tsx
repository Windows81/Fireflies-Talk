import { BottomBorderGlow } from "@/features/auth/components/desktop/BottomBorderGlow";
import { Text } from "@/components/Typography";
import { createStyles, Fonts, useTheme } from "@/styles";
import type { FC } from "react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const GETTING_READY_DURATION_MS = 2000;
const CROSSFADE_DURATION_MS = 500;
const WALKTHROUGH_TEXT_DURATION_MS = 1500;
const DOT_INTERVAL_MS = 400;

type AllSetGettingReadyViewProps = {
  onNavigate: () => void;
};

const LoadingDots: FC = () => {
  const theme = useTheme();
  const [count, setCount] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((prev) => (prev >= 3 ? 1 : prev + 1));
    }, DOT_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <Text
      style={[
        styles.dotText,
        {
          color: theme.colors.textPrimary,
          fontFamily: Fonts.dmSans["500"].regular,
        },
      ]}
    >
      {".".repeat(count)}
    </Text>
  );
};

const WALKTHROUGH_TEXT = [
  "All set. Getting things ready for you",
  "Lets start with a quick walkthrough",
] as const;

export const AllSetGettingReadyView: FC<AllSetGettingReadyViewProps> = ({
  onNavigate,
}) => {
  const theme = useTheme();
  const [step, setStep] = useState(0);
  const fadeIn = useSharedValue(0);
  const stableOnNavigate = useEffectEvent(onNavigate);
  const navigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setStep(1);
      fadeIn.value = withTiming(1, { duration: CROSSFADE_DURATION_MS });
      navigateTimeoutRef.current = setTimeout(
        () => stableOnNavigate(),
        CROSSFADE_DURATION_MS + WALKTHROUGH_TEXT_DURATION_MS,
      );
    }, GETTING_READY_DURATION_MS);
    return () => {
      clearTimeout(t);
      if (navigateTimeoutRef.current) clearTimeout(navigateTimeoutRef.current);
    };
  }, [fadeIn]);

  const messageOpacityStyle = useAnimatedStyle(() => ({
    opacity: step === 0 ? 1 : fadeIn.value,
  }));

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.pageBackground },
      ]}
      edges={["top", "bottom"]}
    >
      <View style={styles.content}>
        <Animated.View style={[styles.messageRow, messageOpacityStyle]}>
          <Text
            variant="heading4Weight"
            color="textPrimary"
            style={styles.message}
          >
            {WALKTHROUGH_TEXT[step]}
          </Text>
          <LoadingDots />
        </Animated.View>
      </View>
      <View style={styles.bottomGlowContainer} pointerEvents="none">
        <BottomBorderGlow />
      </View>
    </SafeAreaView>
  );
};

const styles = createStyles({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    flexWrap: "wrap",
    minHeight: 40,
  },
  message: {
    textAlign: "center",
  },
  dotText: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "500",
  },
  bottomGlowContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    overflow: "hidden",
    height: 500,
    width: "100%",
  },
});
