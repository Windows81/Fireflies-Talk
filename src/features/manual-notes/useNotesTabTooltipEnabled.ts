import { useAuth } from "@/features/auth";
import { useGetCurrentUserQuery, useGetFeedMeetingsQuery } from "@/graphql";

/**
 * Returns true only when the user has had at least 3 meetings
 * and has never taken manual notes — i.e. the Notes tab discovery
 * tooltip should be shown.
 */
export const useNotesTabTooltipEnabled = () => {
  const { user } = useAuth();

  const { data: userData, loading: userLoading } = useGetCurrentUserQuery({
    skip: !user,
  });

  const { data: feedData, loading: feedLoading } = useGetFeedMeetingsQuery({
    variables: { limit: 1, skip: 0 },
    skip: !user,
  });

  if (!user || userLoading || feedLoading) return false;

  const totalMeetings = feedData?.getFeedMeetings.total ?? 0;
  const hasUsedNotes = (userData?.user?.numMeetingsWithNotes ?? 0) > 0;

  return totalMeetings >= 3 && !hasUsedNotes;
};
