import { useCallback } from "react";
import type { SupportedLanguage } from "@firefliesai/mobile-ff.graphql-client";
import { useRemoteConstants } from "./remote-constants";

export function findLanguageBest(
  lang: string,
  supportedLanguages: readonly SupportedLanguage[],
) {
  // the standard uses -, lets unify it here for search.
  let languageCode = lang.replaceAll("_", "-");
  if (languageCode === "en-UK") {
    languageCode = "en-GB";
  }
  const bestSpecifics = supportedLanguages.find(
    (LANG) => LANG.code === languageCode || LANG.name === languageCode,
  );
  if (bestSpecifics) {
    return bestSpecifics;
  }
  if (languageCode.includes("-")) {
    languageCode = languageCode.split("-")[0];
    const bests = supportedLanguages.find(
      (LANG) => LANG.code === languageCode || LANG.name === languageCode,
    );
    if (bests) {
      return bests;
    }
  }
  return null;
}

export function useFindLanguageBest() {
  const { SUPPORTED_LANGUAGES } = useRemoteConstants();

  return useCallback(
    (lang: string) => findLanguageBest(lang, SUPPORTED_LANGUAGES),
    [SUPPORTED_LANGUAGES],
  );
}
