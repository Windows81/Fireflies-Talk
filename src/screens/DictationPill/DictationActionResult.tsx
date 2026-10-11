import { IconAlertCircle, IconCheck, IconCopy, IconSend } from "@/assets/svg";
import type { Theme } from "@/styles";
import { useEffect, useRef, useState, type FC } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { panelStyles } from "./dictationActionPanelStyles";
import { webkitNoDrag } from "./dictationPillStyles";

/** How long a button stays on its confirmation before going back to its job. */
const FLASH_MS = 2000;

type FlashKind = "copied" | "pasted" | "paste-failed";

/**
 * The generated text, in a well of its own with the two ways of taking it.
 *
 * Both actions are silent — the confirmation on the button is the only sign the
 * click did anything, so it has to report a miss as readily as a success.
 */
export const DictationActionResult: FC<{
  result: string;
  theme: Theme;
  onCopy: () => void;
  /** Resolves false when the text did not reach the focused input. */
  onPaste: () => Promise<boolean>;
}> = ({ result, theme, onCopy, onPaste }) => {
  const [flash, setFlash] = useState<FlashKind | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    [],
  );

  const showFlash = (kind: FlashKind) => {
    setFlash(kind);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), FLASH_MS);
  };

  const copy = () => {
    onCopy();
    showFlash("copied");
  };

  const paste = async () => {
    showFlash((await onPaste()) ? "pasted" : "paste-failed");
  };

  return (
    <View style={panelStyles.panelResult}>
      <ScrollView
        style={panelStyles.panelResultScroll}
        contentContainerStyle={panelStyles.panelResultContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={panelStyles.panelResultText} selectable>
          {result}
        </Text>
      </ScrollView>
      <View style={panelStyles.panelResultActions}>
        <Pressable
          testID="no-drag"
          accessibilityRole="button"
          accessibilityLabel="Paste this result into the focused input"
          onPress={() => void paste()}
          style={[panelStyles.panelResultAction, webkitNoDrag]}
        >
          <ActionIcon
            done={flash === "pasted"}
            failed={flash === "paste-failed"}
            Idle={IconSend}
            theme={theme}
          />
          <Text style={panelStyles.panelCopyLabel} numberOfLines={1}>
            {pasteLabel(flash)}
          </Text>
        </Pressable>
        <View style={panelStyles.panelResultDivider} />
        <Pressable
          testID="no-drag"
          accessibilityRole="button"
          accessibilityLabel="Copy this result"
          onPress={copy}
          style={[panelStyles.panelResultAction, webkitNoDrag]}
        >
          <ActionIcon done={flash === "copied"} Idle={IconCopy} theme={theme} />
          <Text style={panelStyles.panelCopyLabel} numberOfLines={1}>
            {flash === "copied" ? "Copied" : "Copy result"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

function pasteLabel(flash: FlashKind | null): string {
  if (flash === "pasted") return "Pasted";
  if (flash === "paste-failed") return "Couldn't paste";
  return "Paste into input";
}

/**
 * A button's icon, which becomes a tick or a warning while its confirmation is
 * showing. The swap fades so the button does not appear to flicker on click.
 */
const ActionIcon: FC<{
  done: boolean;
  failed?: boolean;
  Idle: FC<{ width: number; height: number; color: string }>;
  theme: Theme;
}> = ({ done, failed, Idle, theme }) => {
  const settled = done || failed === true;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(fade, {
      toValue: settled ? 1 : 0,
      duration: 160,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [settled, fade]);

  const Icon = done ? IconCheck : failed ? IconAlertCircle : Idle;
  return (
    <Animated.View style={{ opacity: fade.interpolate(FADE_IN_OUT) }}>
      <Icon width={13} height={13} color={theme.colors.textPrimary} />
    </Animated.View>
  );
};

/** Dips to half opacity mid-swap, so the two icons cross rather than jump. */
const FADE_IN_OUT = {
  inputRange: [0, 0.5, 1],
  outputRange: [1, 0.45, 1],
};
