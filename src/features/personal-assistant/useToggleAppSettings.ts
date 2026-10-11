import {
  useToggleAppSettingsMutation,
  GetPersonalAssistantDocument,
} from "@/graphql";

export interface UseToggleAppSettingsResult {
  setAppEnabled: (id: string, active: boolean) => Promise<void>;
  loading: boolean;
}

export const useToggleAppSettings = (): UseToggleAppSettingsResult => {
  const [toggleAppSettings, { loading }] = useToggleAppSettingsMutation();

  const setAppEnabled = async (id: string, active: boolean) => {
    await toggleAppSettings({
      variables: { id, active },
      refetchQueries: [
        { query: GetPersonalAssistantDocument },
        "listAppSettings",
      ],
    });
  };

  return { setAppEnabled, loading };
};
