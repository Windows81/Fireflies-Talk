import { toast } from "@/components/Toast";
import { liveMeetingsApi } from "@/features/live";
import { apolloClient } from "@/graphql";

// A meeting title is cached under two entities: the `Meeting` entity read by
// the notepad and live header, and the `Source` entity read by list/search
// surfaces. Update both after a rename so the new title reflects everywhere
// without waiting for a refetch.
export function updateMeetingTitleCache(
  meetingId: string,
  title: string,
): void {
  apolloClient.cache.modify({
    id: apolloClient.cache.identify({ __typename: "Meeting", id: meetingId }),
    fields: { title: () => title },
  });
  apolloClient.cache.modify({
    id: apolloClient.cache.identify({
      __typename: "Source",
      id: meetingId,
      parseId: meetingId,
    }),
    fields: { title: () => title },
  });
}

// Shared failure toast so every rename surface reports the same message.
export function notifyMeetingTitleUpdateFailed(error: {
  message: string;
}): void {
  toast({
    title: "Failed to update meeting title",
    message: error.message,
    type: "error",
  });
}

// Roll `attemptedTitle` back to `previousTitle` in this window's overlay and
// cache. Guarded so a stale failure never clobbers a newer rename (or a
// server/AI title): the overlay and each cache entry are only reverted while
// they still hold `attemptedTitle`.
export function revertMeetingTitleCache(
  meetingId: string,
  attemptedTitle: string,
  previousTitle: string,
): void {
  liveMeetingsApi.clearTitleOverride(meetingId, attemptedTitle);
  const revertIfAttempted = (existing: string) =>
    existing === attemptedTitle ? previousTitle : existing;
  apolloClient.cache.modify({
    id: apolloClient.cache.identify({ __typename: "Meeting", id: meetingId }),
    fields: { title: revertIfAttempted },
  });
  apolloClient.cache.modify({
    id: apolloClient.cache.identify({
      __typename: "Source",
      id: meetingId,
      parseId: meetingId,
    }),
    fields: { title: revertIfAttempted },
  });
}

// The rename mutation rejected after an optimistic update: roll the title back
// and surface the failure. Local component state is reverted by the caller.
export function revertOptimisticMeetingTitle(
  meetingId: string,
  attemptedTitle: string,
  previousTitle: string,
  error: { message: string },
): void {
  revertMeetingTitleCache(meetingId, attemptedTitle, previousTitle);
  notifyMeetingTitleUpdateFailed(error);
}
