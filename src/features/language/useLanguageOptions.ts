import { useMemo } from "react";
import { useRemoteConstants } from "@/features/remote-constants";
import type { SupportedLanguageOption } from "./types";

export function useLanguageOptions(): SupportedLanguageOption[] {
  const { SUPPORTED_LANGUAGES } = useRemoteConstants();

  const languageOptions = useMemo(() => {
    return SUPPORTED_LANGUAGES.map((lang) => ({
      label: lang.name,
      value: lang.code,
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, [SUPPORTED_LANGUAGES]);

  return languageOptions;
}
