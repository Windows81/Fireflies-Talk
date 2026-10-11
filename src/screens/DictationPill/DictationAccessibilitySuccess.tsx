import { IconCheck, IconSparkle } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { withAlpha } from "@/styles/color";
import { useEffect, useRef, useState, type FC } from "react";
import { Animated, Easing, View } from "react-native";
import { defaultDictationHint, dictationHotkeyLabel } from "./dictationHint";

const CARD_RADIUS = 18;
const DISC_SIZE = 42;

const SPARKS = [
  { left: 8, top: 4, dx: -16, dy: -20, size: 11, delay: 0, pink: false },
  { left: 36, top: -2, dx: 8, dy: -22, size: 9, delay: 40, pink: true },
  { left: 52, top: 14, dx: 22, dy: -10, size: 12, delay: 70, pink: false },
  { left: 48, top: 38, dx: 18, dy: 14, size: 8, delay: 110, pink: true },
  { left: 22, top: 46, dx: -4, dy: 18, size: 10, delay: 90, pink: false },
  { left: -4, top: 28, dx: -20, dy: 8, size: 9, delay: 50, pink: true },
  { left: -2, top: 8, dx: -14, dy: -8, size: 7, delay: 130, pink: false },
];

/**
 * Granted-permission confirmation. The disc slams in oversized, the check
 * lands with a spring, rings and sparkles fire once, then everything holds.
 * Brand purple is the hero; pink is only a sparkle accent (Fireflies rainbow).
 */
export const DictationAccessibilitySuccess: FC = () => {
  const theme = useTheme();
  const [hotkey, setHotkey] = useState(() =>
    dictationHotkeyLabel(defaultDictationHint()),
  );
  const enter = useRef(new Animated.Value(0)).current;
  const checkPop = useRef(new Animated.Value(0)).current;
  const ringA = useRef(new Animated.Value(0)).current;
  const ringB = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const title = useRef(new Animated.Value(0)).current;
  const subtitle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rise = (value: Animated.Value, delay: number) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 280,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      });

    const pulse = (value: Animated.Value, delay: number) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 700,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      });

    const timeline = Animated.parallel([
      Animated.timing(enter, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.delay(40),
        Animated.spring(checkPop, {
          toValue: 1,
          friction: 4,
          tension: 220,
          useNativeDriver: false,
        }),
      ]),
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(glow, {
          toValue: 0.55,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
      pulse(ringA, 80),
      pulse(ringB, 200),
      rise(title, 140),
      rise(subtitle, 220),
    ]);

    timeline.start();
    return () => timeline.stop();
  }, [checkPop, enter, glow, ringA, ringB, subtitle, title]);

  useEffect(() => {
    const applyHint = (hint: string) => setHotkey(dictationHotkeyLabel(hint));
    void window.electron?.dictation.getShortcut?.().then((snapshot) => {
      if (snapshot?.hint) applyHint(snapshot.hint);
    });
    return window.electron?.dictation.onShortcutChanged?.(applyHint);
  }, []);

  const riseStyle = (value: Animated.Value) => ({
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  });

  return (
    <Animated.View style={[styles.root, { opacity: enter }]}>
      <Animated.View style={[styles.bloom(theme), { opacity: glow }]} />
      <View style={styles.row}>
        <View style={styles.discSlot}>
          <PulseRing progress={ringA} theme={theme} />
          <PulseRing progress={ringB} theme={theme} late />
          {SPARKS.map((spark) => (
            <Spark
              key={`${spark.left}-${spark.delay}`}
              {...spark}
              color={
                spark.pink
                  ? theme.colors.rainbowInteractivePinkDefault
                  : theme.colors.rainbowInteractivePurpleDefault
              }
            />
          ))}
          <Animated.View
            style={[
              styles.disc(theme),
              {
                transform: [
                  {
                    scale: checkPop.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.15, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <IconCheck
              width={18}
              height={18}
              color={theme.colors.layerContrast}
            />
          </Animated.View>
        </View>
        <View style={styles.copy}>
          <Animated.View style={riseStyle(title)}>
            <Text variant="body2Weight" color="textPrimary">
              Congrats! You are all set.
            </Text>
          </Animated.View>
          <Animated.View style={riseStyle(subtitle)}>
            <Text variant="body3Regular" color="textSecondary">
              Go dictate into any app by holding{" "}
              <Text
                color="textSecondary"
                fontFamily="inter"
                fontWeight="700"
                fontSize={12}
              >
                {hotkey}
              </Text>
              .
            </Text>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
};

const PulseRing: FC<{
  progress: Animated.Value;
  theme: ReturnType<typeof useTheme>;
  late?: boolean;
}> = ({ progress, theme, late }) => (
  <Animated.View
    style={[
      styles.ring(theme),
      late && styles.ringLate(theme),
      {
        opacity: progress.interpolate({
          inputRange: [0, 0.18, 1],
          outputRange: [0, 0.7, 0],
        }),
        transform: [
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.85, late ? 1.55 : 1.35],
            }),
          },
        ],
      },
    ]}
  />
);

const Spark: FC<{
  left: number;
  top: number;
  dx: number;
  dy: number;
  size: number;
  delay: number;
  color: string;
}> = ({ left, top, dx, dy, size, delay, color }) => {
  const travel = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const burst = Animated.timing(travel, {
      toValue: 1,
      duration: 620,
      delay: 90 + delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    burst.start();
    return () => burst.stop();
  }, [delay, travel]);

  return (
    <Animated.View
      style={[
        styles.spark,
        {
          left,
          top,
          opacity: travel.interpolate({
            inputRange: [0, 0.15, 0.7, 1],
            outputRange: [0, 1, 0.85, 0],
          }),
          transform: [
            {
              translateX: travel.interpolate({
                inputRange: [0, 1],
                outputRange: [0, dx],
              }),
            },
            {
              translateY: travel.interpolate({
                inputRange: [0, 1],
                outputRange: [0, dy],
              }),
            },
            {
              scale: travel.interpolate({
                inputRange: [0, 0.25, 1],
                outputRange: [0.2, 1.15, 0.6],
              }),
            },
            {
              rotate: travel.interpolate({
                inputRange: [0, 1],
                outputRange: ["-20deg", "18deg"],
              }),
            },
          ],
        },
      ]}
    >
      <IconSparkle width={size} height={size} color={color} />
    </Animated.View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
    justifyContent: "center",
  },
  bloom: (theme) => ({
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.rainbowStaticPurpleSolid, 0.5),
    boxShadow: `inset 0 0 18px ${withAlpha(theme.colors.textBrand, 0.16)}`,
  }),
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
  },
  discSlot: {
    width: DISC_SIZE,
    height: DISC_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  disc: (theme) => ({
    width: DISC_SIZE,
    height: DISC_SIZE,
    borderRadius: DISC_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.interactivePrimaryDefault,
    boxShadow: `0 0 12px ${withAlpha(theme.colors.interactivePrimaryDefault, 0.45)}`,
  }),
  ring: (theme) => ({
    position: "absolute",
    width: DISC_SIZE,
    height: DISC_SIZE,
    borderRadius: DISC_SIZE / 2,
    borderWidth: 2,
    borderColor: withAlpha(theme.colors.rainbowInteractivePurpleDefault, 0.8),
  }),
  ringLate: (theme) => ({
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.rainbowInteractivePinkDefault, 0.7),
  }),
  spark: {
    position: "absolute",
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
});
