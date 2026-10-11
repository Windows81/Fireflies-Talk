import { createStyles, useTheme } from "@/styles";
import { withAlpha } from "@/styles/color";
import { useThread } from "@firefliesai/fred-react";
import { LinearGradient } from "expo-linear-gradient";
import type { FC } from "react";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useAskFredOSubmit } from "../hooks/useAskFredOSubmit";
import { toMeetingFilters } from "../helpers/toMeetingFilters";
import {
  DEFAULT_ASK_FRED_O_SCOPE,
  useAskFredOScope,
} from "../providers/AskFredOScopeProvider";
import { AskFredOComposer } from "./AskFredOComposer";
import { AskFredOHeader } from "./AskFredOHeader";
import { AskFredOHistory } from "./AskFredOHistory";
import { AskFredOMessageList } from "./AskFredOMessageList";

// Android modals draw edge-to-edge, so the keyboard covers the sheet. The
// Dialog drops its bottom safe-area padding once it opens, so lift by all of it.
const AndroidKeyboardSpacer: FC = () => {
  const keyboard = useReanimatedKeyboardAnimation();
  const style = useAnimatedStyle(() => ({
    height: -keyboard.height.value,
  }));

  return <Animated.View style={style} />;
};

export const AskFredOChat: FC<{
  close?: () => void;
  /** Distance from the top of the screen to the chat, for iOS keyboard avoidance. */
  keyboardVerticalOffset?: number;
}> = ({ close, keyboardVerticalOffset }) => {
  const theme = useTheme();
  const { setThread, setInput, setMeetingFilters } = useThread();
  const { setScope } = useAskFredOScope();
  const { paywallBanner } = useAskFredOSubmit();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const resetQuestionContext = () => {
    setInput("");
    setScope(DEFAULT_ASK_FRED_O_SCOPE);
    setMeetingFilters(toMeetingFilters(DEFAULT_ASK_FRED_O_SCOPE, new Date()));
    setIsHistoryOpen(false);
  };

  const onNewChat = () => {
    setThread(null);
    resetQuestionContext();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root(theme)}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {isHistoryOpen ? (
        <AskFredOHistory onSelected={resetQuestionContext} />
      ) : (
        <>
          <AskFredOMessageList />
          {!!paywallBanner && (
            <View style={styles.paywall}>{paywallBanner}</View>
          )}
          <AskFredOComposer />
          {Platform.OS === "android" && <AndroidKeyboardSpacer />}
        </>
      )}

      <LinearGradient
        pointerEvents="none"
        colors={[
          theme.colors.layerDefault,
          withAlpha(theme.colors.layerDefault, 0),
        ]}
        style={styles.topFade}
      />

      <AskFredOHeader
        isHistoryOpen={isHistoryOpen}
        onToggleHistory={() => setIsHistoryOpen((previous) => !previous)}
        onNewChat={onNewChat}
        close={close}
      />
    </KeyboardAvoidingView>
  );
};

const styles = createStyles({
  root: (theme) => ({
    flex: 1,
    backgroundColor: theme.colors.layerDefault,
  }),
  topFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 72,
    zIndex: 5,
  },
  paywall: {
    paddingHorizontal: 12,
  },
});
