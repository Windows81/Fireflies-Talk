import { imageCaptionsVisual, imageCaptionsVisualDark } from "@/assets/images";
import { IconMeetingNoaudio, IconZap } from "@/assets/svg";
import { Button } from "@/components/Button";
import { MessageView } from "@/components/Message";
import { PaywallContent } from "@/components/Paywall";
import { toast } from "@/components/Toast";
import { useAuth } from "@/features/auth";
import { usePaywallConfig } from "@/features/billing";
import { trackPaywallShown } from "@/features/paywall";
import { TranscribeType, useTranscribeMeetingMutation } from "@/graphql";
import { createStyles } from "@/styles";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import { isFreeUser } from "@firefliesai/payments-ff.utils";
import { useEffect, type FC } from "react";
import { View } from "react-native";

const NotepadTranscriptFreeTierPaidWall: FC = () => {
  useEffect(() => {
    trackPaywallShown({
      paywall: "mobile-notepad-transcript",
      from: "notepad_free",
    });
  }, []);

  return (
    <View style={[styles.root, styles.rootPaywallContent]}>
      <PaywallContent
        title="Upgrade to Transcribe Unlimited Meetings"
        description="0 free meetings left. Upgrade to transcribe unlimited meetings & other premium features."
        pwl="mobile_notepad-transcript"
        HeaderIcon={IconZap}
      />
    </View>
  );
};

const NotepadTranscriptForPaidPlan: FC<{ meeting: Meeting }> = ({
  meeting,
}) => {
  const [transcribeMeeting, { data, loading }] = useTranscribeMeetingMutation({
    variables: {
      meetingId: meeting.id,
      type: TranscribeType.Paid,
    },
    onError(err) {
      toast({
        title: "Could not transcribe meeting",
        message: err.message,
        type: "error",
      });
    },
  });

  if (data?.transcribeMeeting) {
    return (
      <View style={styles.root}>
        <MessageView
          headerImage={imageCaptionsVisual}
          headerImageDark={imageCaptionsVisualDark}
          title="Transcription is in progress"
          description="Come back in 5-10 minutes. Please contact support if you need any assistance."
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MessageView
        headerImage={imageCaptionsVisual}
        headerImageDark={imageCaptionsVisualDark}
        title="This meeting is ready to be transcribed"
        description="Now you can transcribe this meeting to generate meeting summary, action items and more."
        action={
          <Button
            style={styles.button}
            onPress={() => transcribeMeeting()}
            disabled={loading}
          >
            Transcribe meeting
          </Button>
        }
      />
    </View>
  );
};

export const NotepadTranscriptNoCaptions: FC<{
  meeting: Meeting;
}> = ({ meeting }) => {
  const { user } = useAuth();

  const { hidePaidFeatures } = usePaywallConfig();

  if (meeting.audioService_metadata?.silentMeeting) {
    return (
      <View style={styles.root}>
        <MessageView
          headerImage={imageCaptionsVisual}
          headerImageDark={imageCaptionsVisualDark}
          header={<IconMeetingNoaudio width={64} height={64} />}
          title="No spoken words detected"
          description="This meeting has no words to transcribe"
        />
      </View>
    );
  }

  if (meeting.audioService_metadata?.audioOnly && !hidePaidFeatures) {
    if (
      user &&
      (user?.notebookId === meeting.owner ||
        meeting.allEmails?.includes(user?.email))
    ) {
      return isFreeUser(user.paidUser) ? (
        <NotepadTranscriptFreeTierPaidWall />
      ) : (
        <NotepadTranscriptForPaidPlan meeting={meeting} />
      );
    } else {
      return (
        <View style={styles.root}>
          <MessageView
            headerImage={imageCaptionsVisual}
            headerImageDark={imageCaptionsVisualDark}
            title="Transcript is not available"
            description="This meeting was not transcribed. Contact the meeting owner for more information."
          />
        </View>
      );
    }
  }

  return (
    <View style={styles.root}>
      <MessageView
        headerImage={imageCaptionsVisual}
        headerImageDark={imageCaptionsVisualDark}
        title="Transcript is not available"
        description="Please contact support for more information"
      />
    </View>
  );
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
