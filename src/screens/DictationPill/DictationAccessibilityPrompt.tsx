import { IconLogo, IconX } from "@/assets/svg";
import { useWebHover } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles, useTheme, type Theme } from "@/styles";
import { withAlpha } from "@/styles/color";
import type { DictationPillSide } from "electron/src/types";
import { useEffect, useRef, useState, type FC } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type ViewStyle,
} from "react-native";
import { DictationAccessibilitySuccess } from "./DictationAccessibilitySuccess";
import type { DictationAccessibilityPhase } from "./useDictationAccessibilityPrompt";

const SUCCESS_HEIGHT = 88;
const NEEDED_FADE_MS = 140;
const SUCCESS_HOLD_MS = 3200;
const FADE_OUT_MS = 380;

function caretOrigin(side: DictationPillSide): string {
  switch (side) {
    case "left":
      return "0% 50%";
    case "right":
      return "100% 50%";
    case "bottom":
      return "50% 100%";
    case "top":
      return "50% 0%";
    default: {
      const _exhaustive: never = side;
      return _exhaustive;
    }
  }
}

export const DictationAccessibilityPrompt: FC<{
  side?: DictationPillSide;
  phase: DictationAccessibilityPhase;
  onDismiss: () => void;
  onOpenSettings: () => void;
}> = ({ side = "bottom", phase, onDismiss, onOpenSettings }) => {
  const theme = useTheme();
  const height = useRef(new Animated.Value(SUCCESS_HEIGHT)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const neededFade = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const measuredHeight = useRef(SUCCESS_HEIGHT);
  const [hasMeasured, setHasMeasured] = useState(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  // The needed card sizes itself to its copy; capture that height so the
  // morph to the shorter congrats card starts from the real value.
  const onNeededLayout = (event: LayoutChangeEvent) => {
    if (phase !== "needed") return;
    measuredHeight.current = event.nativeEvent.layout.height;
    height.setValue(measuredHeight.current);
    if (!hasMeasured) setHasMeasured(true);
  };

  useEffect(() => {
    if (phase !== "success") return;

    height.setValue(measuredHeight.current);
    // Overshooting spring + a scale punch so the morph reads as a pop,
    // not a linear collapse. Origin is the caret so the card stays
    // aimed at the grabber instead of drifting sideways.
    Animated.parallel([
      Animated.spring(height, {
        toValue: SUCCESS_HEIGHT,
        friction: 6,
        tension: 92,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(pop, {
          toValue: 1.06,
          duration: 160,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.spring(pop, {
          toValue: 1,
          friction: 5,
          tension: 160,
          useNativeDriver: false,
        }),
      ]),
      Animated.timing(neededFade, {
        toValue: 0,
        duration: NEEDED_FADE_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();

    const hide = setTimeout(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: FADE_OUT_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) onDismissRef.current();
      });
    }, SUCCESS_HOLD_MS);

    return () => clearTimeout(hide);
  }, [fade, height, neededFade, phase, pop]);

  const exitShift = fade.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 0],
  });

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          opacity: fade,
          transform: [{ translateY: exitShift }, { scale: pop }],
          transformOrigin: caretOrigin(side),
        },
      ]}
    >
      <Animated.View
        onLayout={onNeededLayout}
        style={[
          styles.card(theme),
          (hasMeasured || phase === "success") && { height },
          phase === "success" && styles.cardSuccess,
        ]}
      >
        <Animated.View
          pointerEvents={phase === "needed" ? "auto" : "none"}
          style={{ opacity: neededFade }}
        >
          <View style={styles.neededPad}>
            <NeededContent
              onDismiss={onDismiss}
              onOpenSettings={onOpenSettings}
            />
          </View>
        </Animated.View>
        {phase === "success" && (
          <View pointerEvents="none" style={styles.successLayer}>
            <DictationAccessibilitySuccess />
          </View>
        )}
      </Animated.View>
      <View style={caretStyle(side, theme)} />
    </Animated.View>
  );
};

function caretStyle(side: DictationPillSide, theme: Theme): ViewStyle[] {
  switch (side) {
    case "left":
      return [styles.caret(theme), styles.caretLeft];
    case "right":
      return [styles.caret(theme), styles.caretRight];
    case "bottom":
      return [styles.caret(theme)];
    case "top":
      return [styles.caret(theme), styles.caretTop];
    default: {
      const _exhaustive: never = side;
      return _exhaustive;
    }
  }
}

const NeededContent: FC<{
  onDismiss: () => void;
  onOpenSettings: () => void;
}> = ({ onDismiss, onOpenSettings }) => {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.iconDisc(theme)}>
        <IconLogo width={18} height={18} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="body2Weight" color="textPrimary">
            Allow Accessibility
          </Text>
          <DismissButton onPress={onDismiss} />
        </View>
        <Text variant="body2Regular" color="textSecondary">
          Turn Fireflies on in Accessibility settings so we can type what you
          say into other apps.
        </Text>
        <SettingsButton onPress={onOpenSettings} />
      </View>
    </View>
  );
};

const SettingsButton: FC<{ onPress: () => void }> = ({ onPress }) => {
  const theme = useTheme();
  const { isHovered, webHoverProps } = useWebHover();

  return (
    <Pressable
      testID="no-drag"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open Settings"
      {...webHoverProps}
      style={({ pressed }) => [
        styles.cta(theme),
        isHovered && styles.ctaHover(theme),
        pressed && styles.ctaPressed(theme),
      ]}
    >
      <Text variant="body3Weight" color="textBrand">
        Open Settings
      </Text>
    </Pressable>
  );
};

const DismissButton: FC<{ onPress: () => void }> = ({ onPress }) => {
  const theme = useTheme();
  const { isHovered, webHoverProps } = useWebHover();

  return (
    <Pressable
      testID="no-drag"
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Dismiss"
      {...webHoverProps}
      style={({ pressed }) => [
        styles.dismiss,
        isHovered && styles.dismissHover(theme),
        pressed && styles.dismissPressed(theme),
      ]}
    >
      <IconX
        width={11}
        height={11}
        color={isHovered ? theme.colors.textPrimary : theme.colors.textMuted}
      />
    </Pressable>
  );
};

const styles = createStyles({
  wrap: {
    position: "relative",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 2,
    paddingTop: 20,
    overflow: "visible",
  },
  card: (theme) => ({
    width: 320,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: theme.colors.layerDefault,
    borderColor: theme.colors.borderStaticDefault,
    borderWidth: 1,
    boxShadow: `0 10px 28px ${withAlpha(theme.colors.pageBackground, 0.7)}`,
  }),
  neededPad: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 14,
  },
  cardSuccess: {
    overflow: "visible",
  },
  successLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconDisc: (theme) => ({
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: withAlpha(theme.colors.textBrand, 0.14),
  }),
  body: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  dismiss: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  dismissHover: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Hover,
  }),
  dismissPressed: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral3Hover,
  }),
  cta: (theme) => ({
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: withAlpha(theme.colors.textBrand, 0.12),
    cursor: "pointer",
  }),
  ctaHover: (theme) => ({
    backgroundColor: withAlpha(theme.colors.textBrand, 0.18),
  }),
  ctaPressed: (theme) => ({
    backgroundColor: withAlpha(theme.colors.textBrand, 0.26),
  }),
  caret: (theme) => ({
    width: 10,
    height: 10,
    marginTop: -6,
    backgroundColor: theme.colors.layerDefault,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.borderStaticDefault,
    transform: [{ rotate: "45deg" }],
  }),
  caretTop: {
    position: "absolute",
    top: -4,
    left: "50%",
    marginLeft: -5,
    marginTop: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 1,
    borderTopWidth: 1,
  },
  caretLeft: {
    position: "absolute",
    left: -4,
    top: "50%",
    marginTop: -5,
    borderRightWidth: 0,
    borderLeftWidth: 1,
  },
  caretRight: {
    position: "absolute",
    right: -4,
    top: "50%",
    marginTop: -5,
    borderBottomWidth: 0,
    borderTopWidth: 1,
  },
});
