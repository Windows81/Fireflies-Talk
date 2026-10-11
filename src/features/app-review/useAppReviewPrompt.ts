import { useAppState } from "@/utils/app-state";
import { FEATURE_FLAGS } from "@/features/feature-flags";
import { useFeatureValue } from "@growthbook/growthbook-react";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect } from "react";
import { appReviewApi } from "./app-review.store";
import { defaultReviewPromptConfig } from "./constants";

type AppReviewOptions = {
  checkOnFocus: boolean;
};

/**
 * Custom hook to handle app review prompts
 *
 * @param hasMeetings - Boolean indicating if backend is accessible and meetings/content are available
 * @param options - Optional configuration
 */
export const useAppReviewPrompt = (
  hasMeetings: boolean,
  options: AppReviewOptions = { checkOnFocus: true },
): void => {
  const appState = useAppState();

  const appReviewPromptConfig = useFeatureValue(
    FEATURE_FLAGS.MOBILE_APPREVIEW_PROMPT,
    defaultReviewPromptConfig,
  );

  const checkAndShowPrompt = useCallback(() => {
    if (appReviewPromptConfig?.enabled && hasMeetings) {
      appReviewApi.promptIfReady(appReviewPromptConfig);
    }
  }, [hasMeetings, appReviewPromptConfig]);

  useEffect(() => {
    if (appState === "active") {
      checkAndShowPrompt();
    }
  }, [appState, checkAndShowPrompt]);

  useFocusEffect(
    useCallback(() => {
      if (options.checkOnFocus) {
        checkAndShowPrompt();
      }
    }, [checkAndShowPrompt, options.checkOnFocus]),
  );
};
