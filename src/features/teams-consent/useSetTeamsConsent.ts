import {
  RecordingPreferencesDocument,
  useSetTeamsConsentEnabledMutation,
} from "@/graphql";
import { useCallback } from "react";

/**
 * Writes the meeting-chat consent preference and keeps the preferences query in
 * step, so every surface reading it flips at the same moment.
 */
export function useSetTeamsConsent() {
  const [setEnabled, { loading: saving }] = useSetTeamsConsentEnabledMutation();

  const setTeamsConsent = useCallback(
    (enabled: boolean) =>
      setEnabled({
        variables: { enabled },
        optimisticResponse: {
          __typename: "Mutation",
          setTeamsConsentEnabled: {
            __typename: "RecordingPreferences",
            teamsConsentEnabled: enabled,
          },
        },
        update: (cache, { data }) => {
          const next = data?.setTeamsConsentEnabled;
          if (!next) return;
          cache.writeQuery({
            query: RecordingPreferencesDocument,
            data: {
              recordingPreferences: {
                __typename: "RecordingPreferences",
                teamsConsentEnabled: next.teamsConsentEnabled,
              },
            },
          });
        },
      }),
    [setEnabled],
  );

  return { setTeamsConsent, saving };
}
