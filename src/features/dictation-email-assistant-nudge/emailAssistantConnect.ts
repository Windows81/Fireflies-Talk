import type { DictationEmailAssistantProvider } from "electron/src/types";
import {
  EMAIL_ASSISTANT_CONNECT_PATH,
  EMAIL_ASSISTANT_CONNECT_SOURCE,
} from "./constants";

export const emailAssistantProviderFor = (
  isOutlook?: boolean | null,
): DictationEmailAssistantProvider => (isOutlook ? "outlook" : "gmail");

export const buildEmailAssistantConnectUrl = (dashboardUrl: string): string =>
  `${dashboardUrl.replace(/\/+$/, "")}${EMAIL_ASSISTANT_CONNECT_PATH}?source=${EMAIL_ASSISTANT_CONNECT_SOURCE}&connect=1`;
