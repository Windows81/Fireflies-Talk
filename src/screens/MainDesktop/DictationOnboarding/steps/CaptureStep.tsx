import { IconSlack } from "@/assets/svg/svgs.gen";
import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { withAlpha } from "@/styles/color";
import { useCallback, useEffect, useRef, useState, type FC } from "react";
import { Image, Pressable, TextInput, View } from "react-native";
import { AppMockup } from "../components/AppMockup";
import { DemoScreen } from "../components/DemoScreen";
import { KeycapHint } from "../components/KeycapHint";
import { SendButton } from "../components/SendButton";
import { useDictationDemo } from "../useDictationDemo";

interface CaptureStepProps {
  onComplete: () => void;
  onBack: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const keithAvatar = require("../assets/keith-avatar.png");

/**
 * "processing" covers the gap between releasing the key and the transcription
 * arriving — Continue must not appear until the text is actually in the field.
 * "failed" is the attempt that came back with nothing, which has to say so
 * rather than drop back to the prompt as though it never happened.
 */
type DemoState =
  | "idle"
  | "clicked"
  | "holding"
  | "processing"
  | "failed"
  | "done";

/** What the reply field says around the keycap; null once it holds text. */
const HINTS: Record<DemoState, { before: string; after: string } | null> = {
  idle: null,
  clicked: { before: "Hold", after: "key" },
  holding: { before: "Now speak something and release", after: "key." },
  processing: null,
  failed: {
    before: "We didn't catch anything. Hold",
    after: "key and speak to try again",
  },
  done: null,
};

export const CaptureStep: FC<CaptureStepProps> = ({ onComplete, onBack }) => {
  const theme = useTheme();
  const [demoState, setDemoState] = useState<DemoState>("idle");
  const textInputRef = useRef<TextInput>(null);

  const {
    shortcutLabel,
    held,
    dictatedText,
    result,
    setDictatedText,
    armCapture,
  } = useDictationDemo({
    // A retry is driven from the key, not the field, so a failed attempt
    // starts holding again too.
    onStart: () =>
      setDemoState((s) => (s === "clicked" || s === "failed" ? "holding" : s)),
    onStop: () => setDemoState((s) => (s === "holding" ? "processing" : s)),
    onCancel: () => setDemoState((s) => (s === "holding" ? "failed" : s)),
  });

  useEffect(() => {
    if (demoState !== "holding") return;
    armCapture();
  }, [demoState, armCapture]);

  useEffect(() => {
    if (demoState === "done") textInputRef.current?.focus();
  }, [demoState]);

  useEffect(() => {
    if (result === "waiting") return;
    setDemoState((s) =>
      s === "processing" ? (result === "text" ? "done" : "failed") : s,
    );
  }, [result]);

  const handleTextFieldPress = useCallback(() => {
    setDemoState((s) => (s === "idle" || s === "failed" ? "clicked" : s));
  }, []);

  const hint = dictatedText ? null : HINTS[demoState];
  const showInput = hint === null && demoState !== "idle";

  return (
    <DemoScreen
      title="Your turn. Say something."
      subtitle="Talk works anywhere you can type."
      onClose={onComplete}
      onBack={onBack}
      footer={
        demoState === "done" && (
          <View style={styles.continueWrapper}>
            <Button variant="primary" onPress={onComplete}>
              Continue
            </Button>
          </View>
        )
      }
    >
      <AppMockup
        icon={<IconSlack width={20} height={20} />}
        name="Slack"
        width="100%"
      >
        <View style={styles.messageRow}>
          <Image
            source={keithAvatar}
            style={styles.avatar}
            resizeMode="cover"
            accessibilityLabel="Keith Watts"
          />
          <View style={styles.messageBody}>
            <Text variant="body2Weight" color="textSecondary">
              Keith Watts
            </Text>
            <Text
              variant="body1Regular"
              color="textMuted"
              style={styles.messageText}
            >
              Does Friday at 2 pm work for you?
            </Text>
          </View>
        </View>

        <View style={styles.textFieldRow}>
          <View
            style={[
              styles.textField(theme),
              demoState !== "idle" && styles.textFieldActive(theme),
            ]}
          >
            {demoState === "idle" && (
              <Pressable
                style={styles.fieldOverlay}
                onPress={handleTextFieldPress}
              >
                <Text variant="body2Regular" color="textPrimary">
                  Click here in the reply field
                </Text>
              </Pressable>
            )}
            {showInput ? (
              <TextInput
                ref={textInputRef}
                style={styles.textInput(theme)}
                value={dictatedText}
                onChangeText={setDictatedText}
              />
            ) : (
              <View style={styles.inputSpacer}>
                {hint && (
                  <KeycapHint
                    before={hint.before}
                    label={shortcutLabel}
                    after={hint.after}
                    active={held}
                  />
                )}
              </View>
            )}
            <SendButton enabled={!!dictatedText} />
          </View>
        </View>
      </AppMockup>
    </DemoScreen>
  );
};

const styles = createStyles({
  messageRow: {
    flexDirection: "row" as const,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 10,
    alignItems: "center" as const,
  },
  messageBody: {
    flex: 1,
    gap: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 18,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 3,
  },
  textFieldRow: {
    alignSelf: "stretch" as const,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  textField: (theme) => ({
    alignSelf: "stretch" as const,
    minHeight: 44,
    borderRadius: 6,
    backgroundColor: withAlpha(theme.colors.textPrimary, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.textPrimary, 0.06),
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 9,
    paddingLeft: 12,
    paddingRight: 8,
    gap: 8,
  }),
  textFieldActive: (theme) => ({
    backgroundColor: withAlpha(theme.colors.textPrimary, 0.09),
  }),
  fieldOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 40,
    bottom: 0,
    justifyContent: "center" as const,
    paddingLeft: 12,
    cursor: "pointer" as never,
  },
  textInput: (theme) => ({
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.16,
    outlineStyle: "none" as never,
  }),
  inputSpacer: {
    flex: 1,
    justifyContent: "center" as const,
  },
  continueWrapper: {
    marginTop: 24,
    width: 280,
    alignSelf: "center" as const,
  },
});
