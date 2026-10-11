import { LinearGradient } from "expo-linear-gradient";
import type { FC, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import type { Theme } from "@/styles";
import {
  actionGradientColors,
  ACTION_BUTTON_SIZE,
  ACTION_GRADIENT_END,
  ACTION_GRADIENT_LOCATIONS,
  ACTION_GRADIENT_START,
  ACTION_SKIN_FADE_MS,
  blurFilter,
  iconHoverColor,
  iconRestColor,
  styles,
  webkitNoDrag,
} from "./dictationPillStyles";
import { PILL_RADIUS } from "./dictationPillMode";
import {
  useDictationPillLayer,
  type PillLayerLeave,
} from "./useDictationPillMorph";

/**
 * One of the shell's stacked shapes. All layers are always mounted and fill the
 * shell; only the active one is visible and hit-testable.
 */
export const PillLayer: FC<{
  active: boolean;
  vertical: boolean;
  /** How this layer leaves; the default is the usual quick swap, sitting back. */
  leave?: PillLayerLeave;
  /** How long this layer waits before it starts to show; the default is the usual beat. */
  enterDelayMs?: number;
  children: ReactNode;
}> = ({ active, vertical, leave, enterDelayMs, children }) => {
  const { opacity, scale, blur } = useDictationPillLayer(
    active,
    leave,
    enterDelayMs,
  );
  const interactive = useDelayedPresence(active, enterDelayMs);
  return (
    <Animated.View
      pointerEvents={interactive ? "auto" : "none"}
      style={[
        styles.layer,
        vertical ? styles.layerColumn : styles.layerRow,
        { opacity, transform: [{ scale }] },
        blurFilter(blur),
      ]}
    >
      {children}
    </Animated.View>
  );
};

/**
 * True once an arriving layer has actually begun to show, false the moment it
 * leaves. A layer that waits before fading in must not take clicks or hovers
 * while it is still invisible: the buttons would work before they exist.
 */
function useDelayedPresence(active: boolean, delayMs = 0): boolean {
  const [present, setPresent] = useState(active && delayMs === 0);
  useEffect(() => {
    if (!active) {
      setPresent(false);
      return;
    }
    if (delayMs === 0) {
      setPresent(true);
      return;
    }
    const timer = setTimeout(() => setPresent(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);
  return present;
}

/**
 * Half of the launcher. The two halves butt together, so each rounds only the
 * corners on its own end of the capsule.
 */
export const PillActionButton: FC<{
  edge: "leading" | "trailing";
  vertical: boolean;
  accessibilityLabel: string;
  onPress: () => void;
  onHoverChange: (hovered: boolean) => void;
  Icon: FC<{ width: number; height: number; color: string }>;
}> = ({ edge, vertical, accessibilityLabel, onPress, onHoverChange, Icon }) => {
  const [hovered, setHovered] = useState(false);

  const setHoverState = (next: boolean) => {
    setHovered(next);
    onHoverChange(next);
  };

  return (
    <Pressable
      testID="no-drag"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onHoverIn={() => setHoverState(true)}
      onHoverOut={() => setHoverState(false)}
      style={[
        styles.actionButton,
        cornerRadii(edge, vertical),
        hovered && styles.actionButtonHovered,
        webkitNoDrag,
      ]}
    >
      <View pointerEvents="none">
        <Icon
          width={PILL_ICON_SIZE}
          height={PILL_ICON_SIZE}
          color={hovered ? iconHoverColor : iconRestColor}
        />
      </View>
    </Pressable>
  );
};

function cornerRadii(edge: "leading" | "trailing", vertical: boolean) {
  const r = PILL_RADIUS;
  if (vertical) {
    return edge === "leading"
      ? { borderTopLeftRadius: r, borderTopRightRadius: r }
      : { borderBottomLeftRadius: r, borderBottomRightRadius: r };
  }
  return edge === "leading"
    ? { borderTopLeftRadius: r, borderBottomLeftRadius: r }
    : { borderTopRightRadius: r, borderBottomRightRadius: r };
}

/** The 1px seam between the halves. */
export const PillDivider: FC<{ vertical: boolean }> = ({ vertical }) => (
  <View style={[styles.divider, vertical && styles.dividerVertical]} />
);

export const PillTooltip: FC<{
  label: string;
  theme: Theme;
  urgent?: boolean;
  /** Set together to read as "<label> <keys> <after>", keys on a key cap. */
  keys?: string;
  after?: string;
}> = ({ label, theme, urgent, keys, after }) => (
  <View style={styles.tooltip(theme)}>
    <View style={styles.tooltipRow}>
      <Text
        style={[
          styles.tooltipLabel,
          urgent && styles.tooltipLabelUrgent(theme),
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {keys ? <Text style={styles.tooltipKeys}>{keys}</Text> : null}
      {after ? (
        <Text style={styles.tooltipLabel} numberOfLines={1}>
          {after}
        </Text>
      ) : null}
    </View>
  </View>
);

/**
 * "Ready to paste Ctrl+V" — raised beside the pill when a paste keystroke
 * went out but nothing focused could take the text. Same surface as the
 * tooltip, one line: the key to press sits on a cap.
 */
export const PillToast: FC<{
  theme: Theme;
  label: string;
  keys: string;
}> = ({ theme, label, keys }) => (
  <View style={[styles.toast(theme), styles.tooltipRow]}>
    <Text style={styles.toastLabel} numberOfLines={1}>
      {label}
    </Text>
    <Text style={styles.toastKeys}>{keys}</Text>
  </View>
);

/**
 * Action mode's purple-to-pink fill. It rides inside the shell's clip, so the
 * shell's own radius rounds it and no second border is needed.
 */
export const PillActionSkin: FC<{ active: boolean }> = ({ active }) => {
  const fade = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    const animation = Animated.timing(fade, {
      toValue: active ? 1 : 0,
      duration: ACTION_SKIN_FADE_MS,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [active, fade]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.gradientFill, { opacity: fade }]}
    >
      <LinearGradient
        colors={actionGradientColors}
        locations={[...ACTION_GRADIENT_LOCATIONS]}
        start={ACTION_GRADIENT_START}
        end={ACTION_GRADIENT_END}
        style={styles.gradientFill}
      />
    </Animated.View>
  );
};

export const PILL_ICON_SIZE = Math.round(ACTION_BUTTON_SIZE * 0.41);
