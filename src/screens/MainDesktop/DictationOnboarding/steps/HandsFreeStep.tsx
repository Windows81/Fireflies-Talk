import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { useAuth } from "@/features/auth";
import { useLocalSettings } from "@/features/settings";
import { createStyles, useTheme } from "@/styles";
import { withAlpha } from "@/styles/color";
import { getActualPlatform } from "@/utils/device";
import { useCallback, useEffect, useState, type FC } from "react";
import { Pressable, View } from "react-native";
import { AppMockup } from "../components/AppMockup";
import { DemoScreen } from "../components/DemoScreen";
import { GmailIcon } from "../components/GmailIcon";
import { KeycapHint } from "../components/KeycapHint";
import { handsFreeSubtitle, onboardingShortcutLabel } from "../shortcutCopy";
import { speakingWordsPerMinute } from "../speakingSpeed";
import { handsFreeSuggestedLine } from "../suggestedReply";
import { useDictationDemo } from "../useDictationDemo";

interface HandsFreeStepProps {
  /** Carries the measured speaking rate to the closing comparison. */
  onNext: (spokenWpm: number | null) => void;
  onClose: () => void;
  onBack: () => void;
}

/**
 * "processing" covers the gap between finishing the recording and the
 * transcription arriving, so Continue waits for the text. "failed" is the
 * attempt that came back with nothing, which has to say so rather than drop
 * back to the prompt as though it never happened.
 */
type DemoState =
  | "idle"
  | "armed"
  | "speaking"
  | "processing"
  | "failed"
  | "done";

export const HandsFreeStep: FC<HandsFreeStepProps> = ({
  onNext,
  onClose,
  onBack,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { handsFreeShortcut } = useLocalSettings();
  const platform = getActualPlatform();
  const handsFreeLabel = handsFreeShortcut
    ? onboardingShortcutLabel(handsFreeShortcut, platform)
    : null;
  const [demoState, setDemoState] = useState<DemoState>("idle");
  const [startedViaHandsFreeKey, setStartedViaHandsFreeKey] = useState(false);

  const { shortcutLabel, held, dictatedText, result, spokenMs, armCapture } =
    useDictationDemo({
      onStart: (handsFree) => {
        setStartedViaHandsFreeKey(handsFree);
        if (handsFree) {
          setDemoState((s) =>
            s === "armed" || s === "failed" ? "speaking" : s,
          );
        }
      },
      onLatched: () => {
        setStartedViaHandsFreeKey(false);
        setDemoState((s) => (s === "armed" || s === "failed" ? "speaking" : s));
      },
      onStop: () => setDemoState((s) => (s === "speaking" ? "processing" : s)),
      onCancel: () => setDemoState((s) => (s === "speaking" ? "failed" : s)),
    });

  useEffect(() => {
    if (demoState !== "speaking") return;
    armCapture();
  }, [demoState, armCapture]);

  useEffect(() => {
    if (result === "waiting") return;
    setDemoState((s) =>
      s === "processing" ? (result === "text" ? "done" : "failed") : s,
    );
  }, [result]);

  const canArm = demoState === "idle" || demoState === "failed";

  const handleFieldPress = useCallback(() => {
    setDemoState((s) => (s === "idle" || s === "failed" ? "armed" : s));
  }, []);

  const suggestedLine = handsFreeSuggestedLine(user?.name ?? "");

  // The example line is a prompt to read aloud, so it gives way to the real
  // text — and never stands in for it once the recording has finished.
  const showSuggestion = demoState === "speaking" && !dictatedText;

  return (
    <DemoScreen
      title="Now try a longer reply"
      subtitle={handsFreeSubtitle(shortcutLabel)}
      onClose={onClose}
      onBack={onBack}
    >
      <View style={styles.stack}>
        <AppMockup icon={<GmailIcon />} name="Gmail" width="100%">
          <View style={styles.subjectRow(theme)}>
            <Text
              variant="body1Regular"
              color="textMuted"
              style={styles.subject}
            >
              Subject : Product demo feedback
            </Text>
          </View>

          <View style={styles.bodyArea}>
            <Pressable
              style={[
                styles.field(theme),
                demoState === "idle" && styles.fieldCentered,
              ]}
              onPress={handleFieldPress}
              disabled={!canArm}
            >
              {demoState === "idle" && (
                <Text variant="body2Regular" color="textPrimary">
                  Click the reply field
                </Text>
              )}

              {demoState === "armed" && (
                <KeycapHint
                  before="Double-tap"
                  label={shortcutLabel}
                  orLabel={handsFreeLabel ?? undefined}
                  after="to go hands-free"
                  active={held}
                  color="textPrimary"
                />
              )}

              {demoState === "speaking" && (
                <>
                  {showSuggestion ? (
                    <View style={styles.prompt}>
                      <Text variant="body2Regular" color="textPrimary">
                        Now say:
                      </Text>
                      <Text
                        variant="body2Regular"
                        color="textMuted"
                        style={styles.suggestion}
                      >
                        {suggestedLine}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      variant="body2Regular"
                      color="textPrimary"
                      style={styles.bodyText}
                    >
                      {dictatedText}
                    </Text>
                  )}
                  <KeycapHint
                    before="Tap"
                    label={
                      startedViaHandsFreeKey && handsFreeLabel
                        ? handsFreeLabel
                        : shortcutLabel
                    }
                    after="to finish"
                    active={held}
                    color="textPrimary"
                  />
                </>
              )}

              {demoState === "failed" && (
                <View style={styles.retry}>
                  <Text variant="body2Regular" color="textPrimary">
                    We didn&apos;t catch anything that time.
                  </Text>
                  <KeycapHint
                    before="Double-tap"
                    label={shortcutLabel}
                    after="and speak to try again"
                    active={held}
                  />
                </View>
              )}

              {demoState === "done" && (
                <Text
                  variant="body2Regular"
                  color="textPrimary"
                  style={styles.bodyText}
                >
                  {dictatedText}
                </Text>
              )}
            </Pressable>
          </View>
        </AppMockup>

        {demoState === "done" && (
          <View style={styles.continueRow}>
            <Button
              variant="primary"
              onPress={() =>
                onNext(speakingWordsPerMinute(dictatedText, spokenMs))
              }
            >
              Continue
            </Button>
          </View>
        )}
      </View>
    </DemoScreen>
  );
};

const styles = createStyles({
  stack: {
    alignSelf: "stretch" as const,
    gap: 20,
  },
  subjectRow: (theme) => ({
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(theme.colors.textPrimary, 0.08),
  }),
  subject: {
    fontSize: 15,
    lineHeight: 20,
  },
  bodyArea: {
    padding: 16,
  },
  // The reply area keeps its full height across states so the card does not
  // jump as the demo moves from prompt to dictated email.
  field: (theme) => ({
    minHeight: 172,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: withAlpha(theme.colors.textPrimary, 0.04),
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.textPrimary, 0.09),
    justifyContent: "space-between" as const,
    gap: 16,
    cursor: "pointer" as never,
  }),
  fieldCentered: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  prompt: {
    gap: 10,
  },
  retry: {
    gap: 12,
  },
  suggestion: {
    fontStyle: "italic" as const,
    lineHeight: 22,
  },
  bodyText: {
    lineHeight: 22,
  },
  continueRow: {
    alignItems: "flex-end" as const,
  },
});
