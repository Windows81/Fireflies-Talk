import { Config } from "@/constants";
import { Logger } from "@/logger";
import { useCallback } from "react";
import { Linking } from "react-native";

const logger = new Logger("useAskFredOLinkHandler");

const toInAppUrl = (url: string): string => {
  const dashboardUrl = Config.DASHBOARD_URL.replace(/\/$/, "");
  const needle = `${dashboardUrl}/`;
  if (!url.startsWith(needle)) return url;
  return url.replace(needle, "fireflies://");
};

export const useAskFredOLinkHandler = () =>
  useCallback((url: string): false => {
    Linking.openURL(toInAppUrl(url)).catch((error) => {
      logger.error("Failed to open AskFred-O link:", { error });
    });
    return false;
  }, []);
