import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { useAuth } from "@/features/auth";
import {
  DICTATION_LANGUAGE_OPTIONS,
  useDictationLanguageHints,
  useLocalSettings,
} from "@/features/settings";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { useEffect, useId, useRef, useState, type FC } from "react";
import { Pressable, View } from "react-native";
import {
  nextLanguageHintSelection,
  prefillLanguageHints,
} from "../languageSelection";
import { LanguageDropdown } from "../components/LanguageDropdown";
import { LanguageTagField } from "../components/LanguageTagField";
import { OnboardingCardLayout } from "../OnboardingCardLayout";
import { useDictationOnboardingProgress } from "../progress.store";

interface LanguageStepProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

const CARD_STYLE = {
  maxWidth: 574,
  borderRadius: 32,
  paddingVertical: 40,
  paddingHorizontal: 40,
  backgroundColor: DESKTOP_THEME.grey1050,
  borderColor: DESKTOP_THEME.grey950,
};

const LABEL_BY_CODE = new Map<string, string>(
  DICTATION_LANGUAGE_OPTIONS.map((option) => [option.value, option.label]),
);

/** Seeds the hints from the account language the first time the step opens. */
function usePrefillFromAccount() {
  const user = useAuth((s) => s.user);

  useEffect(() => {
    // Wait for the account to load so an unset language is the user's, not a
    // still-empty store.
    if (!user) return;
    const progress = useDictationOnboardingProgress.getState();
    if (progress.languagePrefilled) return;
    progress.markLanguagePrefilled();

    const settings = useLocalSettings.getState();
    const next = prefillLanguageHints(
      settings.dictationLanguageHints,
      user.preferredLanguage,
    );
    if (next) settings.setDictationLanguageHints(next);
  }, [user]);
}

export const LanguageStep: FC<LanguageStepProps> = ({
  onNext,
  onBack,
  onClose,
}) => {
  const { selected, autoDetect, setSelected, setAutoDetect } =
    useDictationLanguageHints();
  // Snapshot so the switch stays put if auto-detect is turned off mid-step.
  const [showAutoDetect] = useState(autoDetect);
  usePrefillFromAccount();

  const [open, setOpen] = useState(false);
  const dropdownId = useId();
  const fieldRef = useRef<View>(null);

  // Every pick is written straight to settings, so dismissing only hides the
  // list — there is nothing left to commit on the way out.
  const handleCloseDropdown = () => setOpen(false);
  const handleOpenDropdown = () => setOpen(true);
  const handleToggleOpen = () => setOpen((wasOpen) => !wasOpen);
  const handleOutsidePress = open ? handleCloseDropdown : undefined;

  // Escape hands the keyboard back to the field it came from, so Tab carries on
  // from the picker rather than from the top of the card.
  const handleKeyboardClose = () => {
    setOpen(false);
    fieldRef.current?.focus();
  };

  const tags = selected.map((code) => ({
    code,
    label: LABEL_BY_CODE.get(code) ?? code,
  }));

  const handleToggleLanguage = (code: string) => {
    const next = nextLanguageHintSelection(selected, code, autoDetect);
    if (next) setSelected(next);
  };

  return (
    <OnboardingCardLayout
      onBack={onBack}
      onClose={onClose}
      cardStyle={CARD_STYLE}
      onOutsidePress={handleOutsidePress}
    >
      {/* Backdrop presses are handled by the layout; this catches the rest of
          the card. Sits under the picker and the footer. */}
      {open && (
        <Pressable
          style={styles.dismissLayer}
          onPress={handleCloseDropdown}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      )}

      <Text
        variant="heading2"
        color="textPrimary"
        style={styles.title}
        accessibilityRole="header"
      >
        Select all the languages you speak
      </Text>
      <Text variant="body1Regular" color="textMuted" style={styles.subtitle}>
        Talk can dictate in 90+ languages
      </Text>

      <View style={styles.picker}>
        <LanguageTagField
          ref={fieldRef}
          languages={tags}
          expanded={open}
          controls={dropdownId}
          autoDetect={autoDetect}
          onPress={handleToggleOpen}
          onOpenRequest={handleOpenDropdown}
          onRemove={handleToggleLanguage}
        />
        {open && (
          <LanguageDropdown
            id={dropdownId}
            options={DICTATION_LANGUAGE_OPTIONS}
            selected={selected}
            autoDetect={autoDetect}
            showAutoDetect={showAutoDetect}
            onToggleLanguage={handleToggleLanguage}
            onAutoDetectChange={setAutoDetect}
            onClose={handleKeyboardClose}
          />
        )}
      </View>

      <View style={styles.footer}>
        <Button variant="primary" onPress={onNext}>
          Continue
        </Button>
      </View>
    </OnboardingCardLayout>
  );
};

const styles = createStyles({
  title: {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.2,
    textAlign: "center" as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center" as const,
    marginBottom: 40,
  },
  picker: {
    alignSelf: "stretch" as const,
    position: "relative" as const,
    zIndex: 30,
  },
  dismissLayer: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
  },
  footer: {
    alignSelf: "stretch" as const,
    flexDirection: "row" as const,
    justifyContent: "flex-end" as const,
    marginTop: 32,
    zIndex: 20,
  },
});
