import { IconMeetingNoaudio, IconZap } from "@/assets/svg";
import { Button } from "@/components/Button";
import { MessageView } from "@/components/Message";
import { PaywallContent } from "@/components/Paywall";
import { Text } from "@/components/Typography";
import { SKIP_SUMMARY_REASONS } from "@/constants";
import type { AuthUser } from "@/features/auth";
import { useAuth } from "@/features/auth";
import { usePaywallConfig } from "@/features/billing";
import { trackPaywallShown } from "@/features/paywall";
import { createStyles } from "@/styles";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import { isFreeUser } from "@firefliesai/payments-ff.utils";
import { useEffect, type FC } from "react";
import { View } from "react-native";
import { useReprocessSummary } from "./useReprocessSummary";

const NotepadSummaryFreePaywall: FC<{ user: AuthUser }> = () => {
  useEffect(() => {
    trackPaywallShown({
      paywall: "mobile-notepad-meeting-summary",
      from: "notepad_free",
    });
  }, []);
  return (
    <View style={[styles.root, styles.rootPaywallContent]}>
      <PaywallContent
        title="Upgrade to Get Unlimited AI Summary Notes"
        description="Upgrade to pro plan or higher to get unlimited summary notes & other premium features."
        pwl="mobile_notepad-meeting-summary"
        HeaderIcon={IconZap}
      />
    </View>
  );
};

const NotepadSummaryForPaidPlan: FC<{ meeting: Meeting }> = ({ meeting }) => {
  const [reprocessSummary, { loading }] = useReprocessSummary(meeting);

  // runSummaryManually mutation will block until the summary is processed, so we can show a loading state while waiting for the mutation to complete
  if (loading) {
    return (
      <View style={styles.root}>
        <MessageView
          title="Summary is being processed"
          description="Please check back in few minutes"
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text variant="title1Weight">This meeting was not summarized</Text>
      <Text variant="body1LongRegular" color="textMuted" style={styles.text}>
        The meeting might have happened while you ran out of meetings credits,
        so it hasn&#39;t been summarized yet.
      </Text>
      <Button
        style={styles.button}
        onPress={reprocessSummary}
        disabled={loading}
      >
        Summarize meeting
      </Button>
    </View>
  );
};

export const NotepadSummarySkipped: FC<{
  meeting: Meeting;
}> = ({ meeting }) => {
  const { user } = useAuth();

  const { hidePaidFeatures } = usePaywallConfig();

  const notEnoughCaptionsToReprocessSummary =
    meeting.audioService_metadata?.skipSummaryReason?.includes(
      SKIP_SUMMARY_REASONS.NOT_ENOUGH_CAPTIONS,
    );

  if (notEnoughCaptionsToReprocessSummary) {
    return (
      <MessageView
        title="Summary is not available"
        description="Meeting does not have enough transcript to generate a summary."
        variant="error"
      />
    );
  }

  if (meeting.audioService_metadata?.silentMeeting) {
    return (
      <MessageView
        header={<IconMeetingNoaudio width={64} height={64} />}
        title="No spoken words detected"
        description="Meeting does not have any spoken words to generate summary."
      />
    );
  }

  if (hidePaidFeatures) {
    // we cannot show paywall on iOS because of Apple's policy
    return (
      <MessageView
        title="Summary is not available"
        description="This meeting was not summarized."
      />
    );
  }

  if (
    !!user &&
    (user.notebookId === meeting.owner || user.email === meeting.organizerEmail)
  ) {
    if (isFreeUser(user.paidUser)) {
      return <NotepadSummaryFreePaywall user={user} />;
    }
    return <NotepadSummaryForPaidPlan meeting={meeting} />;
  } else {
    return (
      <View style={styles.root}>
        <MessageView
          title="Summary is not available"
          description="This meeting was not summarized. Contact the meeting owner for more information."
        />
      </View>
    );
  }
};

const styles = createStyles({
  root: {
    padding: 24,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  text: {
    textAlign: "center",
  },
  button: {
    marginTop: 16,
  },
  rootPaywallContent: {
    padding: 0,
  },
});
