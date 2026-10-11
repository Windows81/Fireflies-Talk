import { IconArrowUp } from "@/assets/svg";
import { useWebHover } from "@/components/Button";
import { createStyles, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { useThread } from "@firefliesai/fred-react";
import { useCallback, useState, type FC } from "react";
import {
  Platform,
  Pressable,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from "react-native";

export const AskFredComposer: FC<{
  meetingId: string;
  disabled?: boolean;
  /** Nudges the paywall when a blocked user tries to use the composer. */
  onBlockedPress?: () => void;
}> = ({ meetingId, disabled, onBlockedPress }) => {
  const theme = useTheme();
  const { input, setInput, submit, isLoading } = useThread();
  const { isHovered, webHoverProps } = useWebHover();
  const [height, setHeight] = useState(0);

  const canSubmit = !isLoading && !disabled && !!input.trim();

  const onSubmit = useCallback(async () => {
    if (isLoading || disabled) return;
    const query = input.trim();
    if (!query) return;

    tracker.track(TRACKING_EVENTS.MEETING_ASK_FRED_SUBMITTED, {
      meetingId,
      queryLength: query.length,
      platform: "desktop-notepad",
    });

    await submit({
      source: "ask-fred-v1",
      refSource: "desktop-notepad",
      input: query,
    });
    setInput("");
  }, [input, isLoading, disabled, meetingId, setInput, submit]);

  // Enter sends, Shift+Enter inserts a newline (web/desktop only).
  const onKeyPress = useCallback(
    (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (Platform.OS !== "web") return;
      const nativeEvent = event.nativeEvent as TextInputKeyPressEventData & {
        shiftKey?: boolean;
        preventDefault?: () => void;
      };
      if (nativeEvent.key === "Enter" && !nativeEvent.shiftKey) {
        nativeEvent.preventDefault?.();
        void onSubmit();
      }
    },
    [onSubmit],
  );

  const placeholder = disabled
    ? "Upgrade to use AskFred"
    : isLoading
      ? "Generating response..."
      : "AskFred anything...";

  const inputRow = (
    <View style={styles.input(theme)}>
      <TextInput
        value={input}
        onChangeText={setInput}
        onKeyPress={onKeyPress}
        onContentSizeChange={(e) => setHeight(e.nativeEvent.contentSize.height)}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textHint}
        editable={!disabled && !isLoading}
        multiline
        numberOfLines={1}
        style={[styles.textInput(theme), { height: Math.max(20, height) }]}
      />
      {/* While blocked the button keeps its disabled look but stays pressable,
          so the press has somewhere to go: the paywall. */}
      <Pressable
        {...webHoverProps}
        onPress={disabled ? onBlockedPress : onSubmit}
        disabled={disabled ? false : !canSubmit}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        style={[
          styles.send,
          canSubmit
            ? isHovered
              ? styles.sendActiveHover(theme)
              : styles.sendActive(theme)
            : styles.sendDisabled(theme),
        ]}
      >
        <IconArrowUp
          width={20}
          height={20}
          color={
            canSubmit
              ? theme.colors.commandContrastDefault
              : theme.colors.commandPrimaryDisabled
          }
        />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      {disabled ? (
        // The field can't take focus while blocked, so catch presses anywhere
        // on the row rather than only on the send button.
        <Pressable onPress={onBlockedPress}>{inputRow}</Pressable>
      ) : (
        inputRow
      )}
    </View>
  );
};

const styles = createStyles({
  wrapper: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  input: (theme) => ({
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderInteractiveDefault,
    backgroundColor: theme.colors.interactiveNeutral2Default,
  }),
  textInput: (theme) => ({
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    padding: 0,
    maxHeight: 120,
    outlineWidth: 0,
    ...(Platform.OS === "web" && { outline: "none" }),
  }),
  send: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  sendActive: (theme) => ({
    backgroundColor: theme.colors.interactivePrimaryDefault,
  }),
  sendActiveHover: (theme) => ({
    backgroundColor: theme.colors.interactivePrimaryHover,
  }),
  sendDisabled: (theme) => ({
    backgroundColor: theme.colors.interactivePrimaryDisabled,
  }),
});
