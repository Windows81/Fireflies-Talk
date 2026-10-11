import {
  useGetMeetingPrepAppQuery,
  useUpsertMeetingPrepAppMutation,
  type MeetingPrepAppFieldsFragment,
  type UpsertMeetingPrepAppInput,
} from "@/graphql";

export interface UseMeetingPrepAppResult {
  meetingPrepApp: MeetingPrepAppFieldsFragment | undefined;
  loading: boolean;
  toggling: boolean;
  setMeetingPrepEnabled: (active: boolean) => Promise<void>;
  updateMeetingPrepApp: (input: UpsertMeetingPrepAppInput) => Promise<void>;
  refetch: () => void;
}

export const useMeetingPrepApp = (options?: {
  isEnabled?: boolean;
}): UseMeetingPrepAppResult => {
  const { data, loading, refetch } = useGetMeetingPrepAppQuery({
    skip: options?.isEnabled === false,
  });
  const [upsertMeetingPrep, { loading: toggling }] =
    useUpsertMeetingPrepAppMutation();

  const meetingPrepApp = data?.getMeetingPrepApp ?? undefined;

  const setMeetingPrepEnabled = async (active: boolean) => {
    if (!meetingPrepApp) return;

    await upsertMeetingPrep({
      variables: {
        input: {
          active,
          notificationPreference: meetingPrepApp.notificationPreference,
          showCompanyInsights: meetingPrepApp.showCompanyInsights,
          showParticipantInfo: meetingPrepApp.showParticipantInfo,
          showPastNotes: meetingPrepApp.showPastNotes,
          showPastSyncsSummary: meetingPrepApp.showPastSyncsSummary,
        },
      },
    });
    refetch();
  };

  const updateMeetingPrepApp = async (input: UpsertMeetingPrepAppInput) => {
    await upsertMeetingPrep({ variables: { input } });
    refetch();
  };

  return {
    meetingPrepApp,
    loading,
    toggling,
    setMeetingPrepEnabled,
    updateMeetingPrepApp,
    refetch,
  };
};
