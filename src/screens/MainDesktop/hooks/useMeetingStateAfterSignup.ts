import { useMemo } from "react";
import type { CoreFeedMeetingFieldsFragment } from "@/graphql";

const NEW_USER_DAYS_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 3; // 3 days
const MEETING_COUNT_CAP = 3; // Early exit: derived booleans only need 0, 1-2, or 3+

export interface MeetingStateAfterSignup {
  meetingCount: number;
  isNewUser: boolean;
  shouldShowActionsCard: boolean;
}

export function useMeetingStateAfterSignup(
  meetings: CoreFeedMeetingFieldsFragment[] | undefined,
  createdAt: string | undefined,
): MeetingStateAfterSignup {
  return useMemo(() => {
    const userCreatedAt = createdAt ? new Date(createdAt).getTime() : 0;
    const meetingsList = meetings ?? [];
    const length = meetingsList.length;
    let count = 0;
    const isNewUser =
      userCreatedAt >
      new Date(Date.now() - NEW_USER_DAYS_THRESHOLD_MS).getTime();

    for (let i = 0; i < length && count < MEETING_COUNT_CAP; i++) {
      const startTime = meetingsList[i]?.startTime;
      if (startTime && new Date(startTime).getTime() > userCreatedAt) {
        count++;
      } else {
        // Hit a meeting before signup - all remaining are older, stop
        break;
      }
    }

    return {
      shouldShowActionsCard: count <= 2, // 0, 1-2
      meetingCount: count,
      isNewUser,
    };
  }, [meetings, createdAt]);
}
