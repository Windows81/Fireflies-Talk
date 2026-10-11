import { IconArrowUp, IconSquare } from "@/assets/svg";
import { IconButton } from "@/components/Button";
import { TextInput } from "@/components/Input";
import { createStyles, useTheme, vars } from "@/styles";
import { useThread } from "@firefliesai/fred-react";
import type { FC } from "react";
import { View } from "react-native";
import type { SvgProps } from "react-native-svg";
import { useAskFredOSubmit } from "../hooks/useAskFredOSubmit";
import { AskFredOScopeBar } from "./AskFredOScopeBar";

const StopIcon: FC<SvgProps> = (props) => (
  <IconSquare {...props} width={16} height={16} />
);

export const AskFredOComposer: FC = () => {
  const theme = useTheme();
  const { input, setInput, abort, isLoading } = useThread();
  const { isInteractionBlocked, submitQuestion } = useAskFredOSubmit();
  const onSubmit = () => void submitQuestion(input, "composer");

  return (
    <View style={styles.card(theme)}>
      <TextInput
        style={styles.input}
        placeholder={isLoading ? "Fred is working…" : "Ask Fred anything"}
        value={input}
        onValueChange={setInput}
        onSubmitEditing={onSubmit}
        disabled={isInteractionBlocked}
        numberOfLines={3}
        textAlignVertical="top"
      />
      <View style={styles.footer}>
        <AskFredOScopeBar
          style={styles.scope}
          disabled={isInteractionBlocked}
        />
        {isLoading ? (
          <IconButton
            Icon={StopIcon}
            label="Stop generating"
            variant="outlined"
            size="lg"
            style={styles.send}
            onPress={abort}
          />
        ) : (
          <IconButton
            Icon={IconArrowUp}
            label="Send"
            variant="primary"
            size="lg"
            style={styles.send}
            disabled={!input.trim()}
            onPress={onSubmit}
          />
        )}
      </View>
    </View>
  );
};

const styles = createStyles({
  card: (theme) => ({
    ...vars.elevations[1],
    margin: 12,
    padding: 8,
    gap: 4,
    backgroundColor: theme.colors.layerDefault,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticMuted,
    borderRadius: 24,
  }),
  input: {
    borderWidth: 0,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scope: {
    flex: 1,
  },
  send: {
    borderRadius: 9999,
  },
});
