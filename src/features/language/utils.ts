import {
  findLanguageBest,
  useRemoteConstants,
} from "@/features/remote-constants";
import type { SupportedLanguage } from "@firefliesai/mobile-ff.graphql-client";
import { useCallback } from "react";

const MULTI_LANGUAGE_CODE = "multi";

function formatLanguageDisplayName(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

function getLanguageNameByCode(
  code: string,
  supportedLanguages: readonly SupportedLanguage[],
) {
  if (code === MULTI_LANGUAGE_CODE) return "Multi-language";

  const language = findLanguageBest(code, supportedLanguages);
  return language ? formatLanguageDisplayName(language.name) : code;
}

export function useGetLanguageNameByCode() {
  const { SUPPORTED_LANGUAGES } = useRemoteConstants();

  return useCallback(
    (code: string) => getLanguageNameByCode(code, SUPPORTED_LANGUAGES),
    [SUPPORTED_LANGUAGES],
  );
}
