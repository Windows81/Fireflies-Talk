import type { ApolloError } from "@apollo/client";
import { useQuery } from "@apollo/client";
import { GetMeetingDocument } from "@firefliesai/mobile-ff.graphql-client";
import type { DesktopNotepadMeeting } from "../types";

export interface DesktopNotepadMeetingState {
  meeting: DesktopNotepadMeeting | undefined;
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => void;
}

export function useDesktopNotepadMeeting(
  meetingId: string,
): DesktopNotepadMeetingState {
  const { data, loading, error, refetch } = useQuery(GetMeetingDocument, {
    variables: { id: meetingId },
    notifyOnNetworkStatusChange: true,
  });

  return {
    meeting: data?.meeting ?? undefined,
    loading,
    error,
    refetch: () => {
      void refetch();
    },
  };
}
