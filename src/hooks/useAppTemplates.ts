import { useMemo } from "react";
import type { QueryHookOptions } from "@apollo/client";
import {
  useListAppSettingsQuery,
  useListAppTemplatesQuery,
  type AppSettings,
  type AppTemplate,
  type ListAppSettingsQuery,
  type ListAppSettingsQueryVariables,
  type ListAppTemplatesQuery,
  type ListAppTemplatesQueryVariables,
} from "@/graphql";

export interface UseAppTemplatesResult {
  appTemplates: AppTemplate[];
  loading: boolean;
  error: Error | undefined;
  refetch: () => void;
}

export interface UseAppSettingsResult {
  appSettings: AppSettings[];
  loading: boolean;
  error: Error | undefined;
  refetch: () => void;
}

/**
 * Hook to fetch the list of app templates.
 *
 * @param options - Optional Apollo query options (e.g. fetchPolicy, skip)
 * @returns appTemplates array, loading state, error, and refetch function
 */
export function useAppTemplates(
  options?: QueryHookOptions<
    ListAppTemplatesQuery,
    ListAppTemplatesQueryVariables
  >,
): UseAppTemplatesResult {
  const { data, loading, error, refetch } = useListAppTemplatesQuery({
    ...options,
    variables: {},
  });

  const appTemplates = useMemo(
    () => (data?.listAppTemplates ?? []) as AppTemplate[],
    [data],
  );

  return {
    appTemplates,
    loading,
    error: error as Error | undefined,
    refetch,
  };
}

/**
 * Hook to fetch the list of app settings.
 *
 * @param options - Optional Apollo query options (e.g. fetchPolicy, skip)
 * @returns appSettings array, loading state, error, and refetch function
 */
export function useAppSettings(
  options?: QueryHookOptions<
    ListAppSettingsQuery,
    ListAppSettingsQueryVariables
  >,
): UseAppSettingsResult {
  const { data, loading, error, refetch } = useListAppSettingsQuery({
    ...options,
    variables: {},
  });

  const appSettings = useMemo(
    () => (data?.listAppSettings ?? []) as AppSettings[],
    [data],
  );

  return {
    appSettings,
    loading,
    error: error as Error | undefined,
    refetch,
  };
}

export const useAppTemplatesAndSettings = () => {
  const { appTemplates, loading: templatesLoading } = useAppTemplates();
  const { appSettings, loading: settingsLoading } = useAppSettings();

  const aiApps = useMemo(() => {
    const settingsTitles = new Set(
      appSettings
        .filter((a) => a.title)
        .map((a) => a.title!.toLowerCase().replace(/\s/g, "")),
    );

    const filteredTemplates = appTemplates.filter(
      (t) =>
        !t.title ||
        !settingsTitles.has(t.title.toLowerCase().replace(/\s/g, "")),
    );

    const merged = [...filteredTemplates, ...appSettings];

    const seen = new Set<string>();
    return merged.filter((t) => {
      if (!t.title) return true;
      const key = t.title.toLowerCase().replace(/\s/g, "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [appTemplates, appSettings]);

  return {
    aiApps,
    loading: templatesLoading || settingsLoading,
  };
};
