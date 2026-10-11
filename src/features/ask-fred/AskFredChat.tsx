import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { MessageView } from "@/components/Message";
import { Toaster } from "@/components/Toast";
import { openLoginPopup, useAuth } from "@/features/auth";
import { useBilling } from "@/features/billing";
import { Breakpoint, createStyles, useTheme } from "@/styles";
import { useQuery } from "@apollo/client";
import {
  GetMeetingSummaryQueryDocument,
  type Meeting,
} from "@firefliesai/mobile-ff.graphql-client";
import { type FC } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  View,
} from "react-native";
import { AskFredPaywall, AskFredPaywallModal } from "./AskFredPaywall";
import { AskFredHeader } from "./components/AskFredHeader";
import { AskFredInput } from "./components/AskFredInput";
import { AskFredMessages } from "./components/AskFredMessages";
import type { AskFredSubmitParams } from "./types/askFred";

const SHEET_HEIGHT_RATIO = 0.9;

const AskFredContent: FC<{
  meeting: Meeting;
  submitParams?: AskFredSubmitParams;
  /** Distance from the top of the screen to the chat, for iOS keyboard avoidance. */
  keyboardVerticalOffset?: number;
}> = ({ meeting, submitParams, keyboardVerticalOffset }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { isAllowedToUsePrompts, loading: loadingBilling } = useBilling();
  const shouldShowPaywall = !isAllowedToUsePrompts && !loadingBilling;

  // Get prompt suggestions from meeting summary
  const { data: dataSummary } = useQuery(GetMeetingSummaryQueryDocument, {
    variables: { meetingId: meeting.id },
  });

  const promptSuggestions =
    dataSummary?.meetingSummary.summary?.promptSuggestions;

  if (!user) {
    return (
      <MessageView
        title="AskFred: ChatGPT for Meetings"
        description="AskFred allows you to extract insights and answer questions from your meetings"
        action={
          <Button onPress={() => openLoginPopup("notepad/ask-fred")}>
            Get started
          </Button>
        }
      />
    );
  }

  if (shouldShowPaywall) {
    return <AskFredPaywall from="meeting-ask-fred" />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.root(theme)}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <View style={styles.content}>
        <View style={styles.main}>
          <AskFredMessages
            meeting={meeting}
            promptSuggestions={promptSuggestions || undefined}
            submitParams={submitParams}
          />
        </View>
        <AskFredInput meeting={meeting} submitParams={submitParams} />
      </View>
    </KeyboardAvoidingView>
  );
};

export const NotepadAskFred: FC<{
  meeting: Meeting;
}> = ({ meeting }) => {
  return <AskFredContent meeting={meeting} />;
};

export const AskFredChatModal: FC<{
  meeting: Meeting;
  isOpen: boolean;
  close: () => void;
  submitParams?: AskFredSubmitParams;
}> = ({ meeting, isOpen, close, submitParams }) => {
  const {
    isAllowedToUsePrompts,
    loading: loadingBilling,
    isFreeUser,
  } = useBilling();
  const shouldShowPaywall = !isAllowedToUsePrompts && !loadingBilling;
  const { height } = useWindowDimensions();
  // iOS: the sheet stays full height behind the keyboard, which then shows the
  // sheet (not the backdrop) around its rounded corners.
  const extendsBehindKeyboard =
    useTheme().breakpoint < Breakpoint.Medium && Platform.OS === "ios";

  if (shouldShowPaywall && isOpen && isFreeUser) {
    // upgrade paywall for free users which show
    // paid features
    return (
      <AskFredPaywallModal
        isOpen={isOpen}
        close={close}
        from="meeting-ask-fred"
      />
    );
  }

  return (
    <Dialog.Root
      isOpen={isOpen}
      close={close}
      variant="bottomSheet"
      style={extendsBehindKeyboard && styles.sheet}
      avoidKeyboard={!extendsBehindKeyboard}
    >
      <View style={styles.modalRoot}>
        <AskFredHeader close={close} />
        <AskFredContent
          meeting={meeting}
          submitParams={submitParams}
          keyboardVerticalOffset={
            extendsBehindKeyboard ? height * (1 - SHEET_HEIGHT_RATIO) : 0
          }
        />
      </View>
      <Toaster />
    </Dialog.Root>
  );
};

const styles = createStyles({
  root: (theme) => ({
    flex: 1,
    backgroundColor: theme.colors.layerDefault,
  }),
  // A fixed height pins the sheet top, which the keyboard offset is measured from.
  sheet: {
    height: `${SHEET_HEIGHT_RATIO * 100}%`,
  },
  modalRoot: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "100%",
  },
  content: {
    flex: 1,
  },
  main: {
    flex: 1,
  },
});
