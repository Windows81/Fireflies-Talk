import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { MessageView } from "@/components/Message";
import { DesktopPaywallCard } from "@/components/Paywall";
import { Toaster } from "@/components/Toast";
import { openLoginPopup, useAuth } from "@/features/auth";
import { useBilling } from "@/features/billing";
import { createStyles } from "@/styles";
import { isDesktop } from "@/utils/device";
import { useQuery } from "@apollo/client";
import {
  GetMeetingSummaryQueryDocument,
  type Meeting,
} from "@firefliesai/mobile-ff.graphql-client";
import { type FC } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { AskFredPaywall } from "./AskFredPaywall";
import { AskFredHeader } from "./components/AskFredHeader";
import { LiveAssistInput } from "./components/LiveAssistInput";
import { LiveAssistMessages } from "./components/LiveAssistMessages";
import { LiveAssistSidePanelHeader } from "./components/LiveAssistSidePanelHeader";

const LiveAssistContent: FC<{
  meeting: Meeting;
  close?: () => void;
  inModal?: boolean;
  showAssistInput?: boolean;
  showHeader?: boolean;
  containerRef?: React.RefObject<View | null>;
  isDemo?: boolean;
}> = ({
  meeting,
  close,
  inModal = false,
  showAssistInput = true,
  showHeader = true,
  containerRef,
  isDemo = false,
}) => {
  const { user } = useAuth();
  const {
    isAllowedToUsePrompts,
    loading: loadingBilling,
    isFreeUser,
  } = useBilling();

  const shouldShowPaywall =
    !isDemo && !isAllowedToUsePrompts && !loadingBilling;

  const shouldShowDesktopPaywall = shouldShowPaywall && isDesktop;
  const shouldShowMobilePaywall = shouldShowPaywall && !isDesktop;

  // Get prompt suggestions from meeting summary
  const { data: dataSummary } = useQuery(GetMeetingSummaryQueryDocument, {
    variables: { meetingId: meeting.id },
  });

  const promptSuggestions =
    dataSummary?.meetingSummary.summary?.promptSuggestions;

  if (!user) {
    return (
      <MessageView
        title="Live Assist: AI for Live Meetings"
        description="Live Assist helps you get insights from your ongoing meetings"
        action={
          <Button onPress={() => openLoginPopup("live/ask-fred")}>
            Get started
          </Button>
        }
      />
    );
  }

  if (shouldShowDesktopPaywall) {
    // In modal view (narrow desktop window), show mobile-style paywall
    if (inModal) {
      return (
        <>
          {showHeader ? (
            <LiveAssistSidePanelHeader onClose={close} />
          ) : (
            <AskFredHeader close={close} title="AskFred" />
          )}
          <AskFredPaywall close={close} from="live-assist-ask-fred" />
        </>
      );
    }

    // In panel view (wide desktop window), show desktop paywall card. Free users
    // are sold a plan; paid users out of credits are sold the credits add-on.
    return (
      <DesktopPaywallCard
        title="Get access to AskFred"
        description={
          isFreeUser
            ? "To use AskFred and enjoy other AI-powered features, please upgrade to a paid plan."
            : "To use AskFred and enjoy other AI-powered features, please subscribe to AI credits."
        }
        pwl="desktop_ask-fred"
        forAskFred
        ctaText={isFreeUser ? "Upgrade" : "Subscribe AI Credits"}
        from="live-assist-askfred"
        showCreditsInfo
      />
    );
  }

  // Mobile: Show mobile paywall
  if (shouldShowMobilePaywall) {
    return (
      <>
        {showHeader ? (
          <LiveAssistSidePanelHeader onClose={close} />
        ) : (
          inModal && <AskFredHeader close={close} title="AskFred" />
        )}
        <AskFredPaywall from="live/ask-fred" />
      </>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, inModal && styles.rootWithModal]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {showHeader ? (
        <LiveAssistSidePanelHeader onClose={close} showFredIcon={!isDesktop} />
      ) : (
        inModal && <AskFredHeader close={close} title="AskFred" />
      )}
      <View style={styles.content}>
        <View style={styles.main}>
          <LiveAssistMessages
            meeting={meeting}
            promptSuggestions={promptSuggestions}
            containerRef={containerRef}
          />
        </View>
        {showAssistInput && <LiveAssistInput meeting={meeting} />}
      </View>
    </KeyboardAvoidingView>
  );
};

export { LiveAssistContent };

export const LiveAssistModal: FC<{
  meeting: Meeting;
  isOpen: boolean;
  close: () => void;
  isDemo?: boolean;
}> = ({ meeting, isOpen, close, isDemo }) => {
  return (
    <Dialog.Root isOpen={isOpen} close={close} variant="bottomSheet">
      <LiveAssistContent
        meeting={meeting}
        close={close}
        inModal
        isDemo={isDemo}
      />
      <Toaster />
    </Dialog.Root>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
  },
  rootWithModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  content: {
    flex: 1,
    flexDirection: "column",
  },
  main: {
    flex: 1,
    overflow: "hidden",
  },
});
