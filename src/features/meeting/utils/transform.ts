import type { Meeting, Source } from "@/graphql";
import type { MeetingNotesPrivacy } from "@firefliesai/mobile-ff.graphql-client";

export const meetingSourceToMeeting = (source: Source): Meeting => {
  return {
    id: source.parseId as string,
    title: source.title as string,
    notesPrivacy: source.privacy as MeetingNotesPrivacy,
    addedBy: source.addedBy,
    owner: source.owner,
    duration: source.duration,
    allEmails:
      typeof source.allEmails === "string"
        ? source.allEmails.split(" ")
        : source.allEmails,
    organizerEmail: source.creator_email as string,
  };
};
