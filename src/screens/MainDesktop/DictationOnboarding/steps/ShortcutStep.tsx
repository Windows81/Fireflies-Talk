import { IconGlobe } from "@/assets/svg/svgs.gen";
import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { useLocalSettings } from "@/features/settings";
import { cancelDemoRecording } from "@/hooks/dictationInAppCapture";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME, withAlpha } from "@/styles/color";
import { getActualPlatform } from "@/utils/device";
import { useCallback, useEffect, useState, type FC } from "react";
import { Pressable, View } from "react-native";
import { FnBadge } from "../components/FnBadge";
import { OnboardingCardLayout } from "../OnboardingCardLayout";
import { TalkShortcutModal } from "../TalkShortcutModal";
import { onboardingShortcutLabel, shortcutDictateHint } from "../shortcutCopy";

interface ShortcutStepProps {
  onComplete: () => void;
  onBack: () => void;
}

/** Only the macOS Fn/Globe cap carries the globe glyph under its label. */
const isGlobeKey = (key: string): boolean => key.toLowerCase() === "fn";

// Word by word so a long combination wraps the sentence like prose instead of
// pushing the whole second half onto its own line.
const TITLE_BEFORE = ["When", "pressing"];
const TITLE_AFTER = ["does", "the", "key", "turn", "green?"];

const TitleWords: FC<{ words: string[] }> = ({ words }) => (
  <>
    {words.map((word) => (
      <Text
        key={word}
        variant="heading2"
        color="textPrimary"
        style={styles.titleText}
      >
        {word}
      </Text>
    ))}
  </>
);

const CARD_STYLE = {
  maxWidth: 608,
  borderRadius: 32,
  paddingVertical: 40,
  paddingHorizontal: 40,
  backgroundColor: DESKTOP_THEME.grey1050,
  borderColor: DESKTOP_THEME.grey950,
};

const MODAL_CARD_STYLE = {
  maxWidth: 574,
  borderRadius: 16,
  paddingVertical: 24,
  paddingHorizontal: 24,
  backgroundColor: DESKTOP_THEME.grey1050,
  borderColor: DESKTOP_THEME.grey950,
};

export const ShortcutStep: FC<ShortcutStepProps> = ({ onComplete, onBack }) => {
  const theme = useTheme();
  const { dictationShortcut } = useLocalSettings();
  const platform = getActualPlatform();
  const [pressed, setPressed] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState(false);
  const shortcutLabel = onboardingShortcutLabel(dictationShortcut, platform);

  /**
   * This step only verifies that the key registers, so a press must not commit
   * a recording. Releasing the hotkey would otherwise finalize normal dictation
   * and paste whatever was said into the app behind Fireflies, so the paste is
   * suppressed for as long as the step is mounted and each release cancels the
   * in-flight recording outright.
   */
  useEffect(() => {
    const dict = window.electron?.dictation;
    const release = () => {
      setPressed(false);
      cancelDemoRecording(() => dict?.requestCancel?.());
    };
    const unsubs = [
      dict?.onHotkeyHeld?.(setPressed),
      dict?.onCapture?.(() => setPressed(true)),
      dict?.onStart?.(() => setPressed(true)),
      dict?.onStop?.(release),
      dict?.onCancel?.(() => setPressed(false)),
    ];
    return () => {
      unsubs.forEach((unsub) => unsub?.());
      cancelDemoRecording(() => dict?.requestCancel?.());
    };
  }, []);

  const handleShortcutModalClose = useCallback(() => {
    setEditingShortcut(false);
  }, []);

  const handleChangeShortcut = useCallback(() => {
    setEditingShortcut(true);
  }, []);

  const handleComplete = useCallback(() => {
    cancelDemoRecording(() => window.electron?.dictation?.requestCancel?.());
    onComplete();
  }, [onComplete]);

  // The snapshot label is " + " separated, so each key gets its own cap.
  const shortcutKeys = shortcutLabel.split(" + ");

  const activeKeyBg = pressed ? DESKTOP_THEME.green600 : DESKTOP_THEME.grey910;

  const activeKeyBorder = pressed
    ? DESKTOP_THEME.green600
    : DESKTOP_THEME.grey790;

  const activeKeyTextColor = pressed
    ? DESKTOP_THEME.grey100
    : DESKTOP_THEME.grey400;

  if (editingShortcut) {
    return (
      <OnboardingCardLayout cardStyle={MODAL_CARD_STYLE}>
        <TalkShortcutModal onClose={handleShortcutModalClose} />
      </OnboardingCardLayout>
    );
  }

  return (
    <OnboardingCardLayout onBack={onBack} cardStyle={CARD_STYLE}>
      <View style={styles.titleRow} accessibilityRole="header">
        <TitleWords words={TITLE_BEFORE} />
        <FnBadge label={shortcutLabel} />
        <TitleWords words={TITLE_AFTER} />
      </View>

      <Text variant="body1Regular" color="textMuted" style={styles.subtitle}>
        {shortcutDictateHint(shortcutLabel)}
      </Text>

      <View style={styles.keyContainer(theme)}>
        {shortcutKeys.map((key, index) => (
          <View
            key={`${key}-${index}`}
            style={[
              styles.keyMockup,
              {
                backgroundColor: activeKeyBg,
                borderColor: activeKeyBorder,
              },
            ]}
          >
            {isGlobeKey(key) ? (
              <>
                <Text
                  variant="body1Regular"
                  style={
                    {
                      color: activeKeyTextColor,
                      fontSize: 14,
                      lineHeight: 14,
                      letterSpacing: -0.16,
                      position: "absolute",
                      top: 6,
                      right: 7,
                    } as never
                  }
                >
                  {key}
                </Text>
                <View style={styles.keyGlobe}>
                  <IconGlobe
                    width={14}
                    height={14}
                    color={activeKeyTextColor}
                  />
                </View>
              </>
            ) : (
              <Text
                variant="body1Regular"
                style={
                  {
                    color: activeKeyTextColor,
                    fontSize: 14,
                    lineHeight: 20,
                    letterSpacing: -0.16,
                  } as never
                }
              >
                {key}
              </Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={styles.changeShortcutButton}
          onPress={handleChangeShortcut}
          accessibilityRole="button"
        >
          <Text variant="body2Regular" color="textMuted">
            Change Shortcut
          </Text>
        </Pressable>
        <Button variant="primary" onPress={handleComplete}>
          Yes, It Does
        </Button>
      </View>
    </OnboardingCardLayout>
  );
};

const styles = createStyles({
  titleRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    rowGap: 4,
    columnGap: 6,
    marginBottom: 8,
  },
  titleText: {
    fontSize: 22,
    lineHeight: 32,
    letterSpacing: -0.2,
    textAlign: "center" as const,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center" as const,
    marginBottom: 32,
  },
  keyContainer: (theme) => ({
    flexDirection: "row" as const,
    gap: 12,
    height: 124,
    backgroundColor: withAlpha(theme.colors.textPrimary, 0.05),
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.textPrimary, 0.05),
    borderRadius: 8,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 32,
    alignSelf: "stretch" as const,
  }),
  keyMockup: {
    width: 60,
    height: 60,
    borderRadius: 9,
    borderWidth: 1,
    position: "relative" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    boxShadow:
      "0px 3px 8px rgba(0, 0, 0, 0.13), 0px 2px 5px rgba(0, 0, 0, 0.13), 0px 1px 1px rgba(0, 0, 0, 0.13)",
  },
  keyGlobe: {
    position: "absolute" as const,
    left: 7,
    bottom: 7,
  },
  buttonRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "flex-end" as const,
    alignSelf: "stretch" as const,
    gap: 8,
  },
  changeShortcutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    cursor: "pointer" as never,
  },
});
