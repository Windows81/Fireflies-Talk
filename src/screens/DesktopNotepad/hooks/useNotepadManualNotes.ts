import {
  MeetingSummaryStatus,
  useFetchSummaryStatusQuery,
  useGetMeetingManualNotesQuery,
} from "@/graphql";

export interface NotepadManualNotesState {
  /** Trimmed manual notes authored during the call, or null when empty. */
  notes: string | null;
  shouldMerge: boolean;
  hasMerged: boolean;
  /** Summary must exist before notes can be merged into it. */
  canMerge: boolean;
  loading: boolean;
}

// Server-side manual notes for a completed meeting (authored from the desktop
// app during the call). Read-only here, mirroring dashboard-ff's MyNotes.
export function useNotepadManualNotes(
  meetingId: string,
): NotepadManualNotesState {
  const { data, loading } = useGetMeetingManualNotesQuery({
    variables: { meetingId },
    // Revalidate on mount so the merged flag stays fresh even when this tab was
    // unmounted during a merge (refetchQueries only touches mounted queries).
    fetchPolicy: "cache-and-network",
  });

  const { data: statusData, loading: statusLoading } =
    useFetchSummaryStatusQuery({
      variables: { meetingId },
    });

  const note = data?.meetingNote;
  const raw = note?.manualNotes?.notes ?? "";

  return {
    notes: raw.trim() ? raw : null,
    shouldMerge: Boolean(note?.manualNotes?.shouldMerge),
    hasMerged: Boolean(note?.audioServiceMetadata?.hasManualNotesMerged),
    canMerge:
      !statusLoading &&
      statusData?.fetchSummaryStatus === MeetingSummaryStatus.Processed,
    loading: loading || statusLoading,
  };
}
