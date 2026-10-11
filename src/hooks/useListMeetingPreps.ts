import { useMemo } from "react";
import {
  ListMeetingPrepsDocument,
  type ListMeetingPrepsQuery,
  useListMeetingPrepsQuery,
} from "@firefliesai/ai-apps-service.graphql-client";

export function buildMeetingPrepEventIdSet(
  data: ListMeetingPrepsQuery | undefined,
): Set<string> {
  const ids = new Set<string>();
  for (const item of data?.listMeetingPreps?.items ?? []) {
    ids.add(item.calendarEventId);
    if (item.meetingId) ids.add(item.meetingId);
  }
  return ids;
}

/**
 * Fetches all calendar event IDs that have meeting prep available
 */
export const useListMeetingPreps = () => {
  const { data, loading } = useListMeetingPrepsQuery();

  const meetingPrepEventIds = useMemo(
    () => (data ? buildMeetingPrepEventIdSet(data) : null),
    [data],
  );

  return { meetingPrepEventIds, loading };
};

export { ListMeetingPrepsDocument };
