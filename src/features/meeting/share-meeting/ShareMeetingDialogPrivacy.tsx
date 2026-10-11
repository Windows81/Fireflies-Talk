import { SharePrivacyField } from "@/components/Share";
import { toast } from "@/components/Toast";
import type { Meeting, Source } from "@/graphql";
import type { MeetingNotesPrivacy } from "@firefliesai/mobile-ff.graphql-client";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { useMutation } from "@apollo/client";
import { UpdateMeetingDocument } from "@firefliesai/mobile-ff.graphql-client";
import type { FC } from "react";
import { useMeetingPrivacyOptions } from "../utils/permissions";
import { useMeetingCapabilities } from "../utils/permissions";
import { isDesktop } from "@/utils/device";

export const ShareMeetingDialogPrivacy: FC<{
  meeting: Meeting;
}> = ({ meeting }) => {
  const { canEditPrivacy } = useMeetingCapabilities(meeting);
  const privacyOptions = useMeetingPrivacyOptions();
  const [updateMeeting, { loading }] = useMutation(UpdateMeetingDocument, {
    onError(err) {
      toast({
        title: "Could not update meeting",
        message: err.message,
        type: "error",
      });
    },
  });

  return (
    <SharePrivacyField
      value={meeting.notesPrivacy || (meeting as Source).privacy}
      onChange={(value) => {
        updateMeeting({
          variables: {
            id: meeting.id,
            notesPrivacy: value as MeetingNotesPrivacy,
          },
        });
        if (isDesktop && window.electron?.recordingContext) {
          window.electron.recordingContext.requestUpdate({
            meetingId: meeting.id,
            notesPrivacy: value as MeetingNotesPrivacy,
          });
        }
        tracker.track(TRACKING_EVENTS.MEETING_PRIVACY_UPDATED, {
          id: meeting.id,
          previousPrivacy: meeting.notesPrivacy,
          privacy: value,
          from: "meeting-share-dialog",
        });
      }}
      loading={loading}
      canChange={canEditPrivacy}
      options={privacyOptions}
    />
  );
};
