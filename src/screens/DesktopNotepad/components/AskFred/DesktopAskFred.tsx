import {
  AskFredMessages,
  AskFredPaywallBanner,
  useAskFredPaywall,
  type AskFredPaywallSource,
} from "@/features/ask-fred";
import { useShakeAnimation } from "@/hooks/useShakeAnimation";
import { createStyles } from "@/styles";
import { useQuery } from "@apollo/client";
import { GetMeetingSummaryQueryDocument } from "@firefliesai/mobile-ff.graphql-client";
import { type FC } from "react";
import { View } from "react-native";
import { useDesktopNotepadContext } from "../../DesktopNotepadContext";
import { AskFredComposer } from "./AskFredComposer";
import { AskFredGreeting } from "./AskFredGreeting";

const PAYWALL_SOURCE: AskFredPaywallSource = {
  pwl: "desktop_notepad-ask-fred",
  from: "desktop-notepad-ask-fred",
};

export const DesktopAskFred: FC = () => {
  const { meeting } = useDesktopNotepadContext();
  const paywall = useAskFredPaywall(PAYWALL_SOURCE);
  const { style: shakeStyle, shake } = useShakeAnimation();

  const { data } = useQuery(GetMeetingSummaryQueryDocument, {
    variables: { meetingId: meeting.id },
  });

  const promptSuggestions =
    data?.meetingSummary.summary?.promptSuggestions ?? undefined;

  const isGated = !!paywall;

  return (
    <View style={styles.root}>
      <View style={styles.messages}>
        <AskFredMessages
          meeting={meeting}
          promptSuggestions={promptSuggestions}
          showEmptyStateWhileLoading
          emptyState={
            <AskFredGreeting
              meetingId={meeting.id}
              promptSuggestions={promptSuggestions}
              onBlockedPress={isGated ? shake : undefined}
            />
          }
        />
      </View>
      {paywall && (
        <View style={styles.paywall}>
          <AskFredPaywallBanner paywall={paywall} style={shakeStyle} />
        </View>
      )}
      <AskFredComposer
        meetingId={meeting.id}
        disabled={isGated}
        onBlockedPress={shake}
      />
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
  },
  messages: {
    flex: 1,
    minHeight: 0,
  },
  paywall: {
    paddingHorizontal: 20,
  },
});
