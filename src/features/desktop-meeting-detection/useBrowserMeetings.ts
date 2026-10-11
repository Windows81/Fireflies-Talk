import { isDesktop } from "@/utils/device";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth";
import type { BrowserWithUrlSupport } from "./types";

/**
 * Browser name type - derived from BROWSERS_WITH_URL_SUPPORT constant.
 * @see src/features/desktop-meeting-detection/types.ts
 */
export type BrowserName = BrowserWithUrlSupport;

export type MeetingUrlWithBrowser = {
  url: string;
  browser: BrowserName;
};

interface BrowserMeetingsData {
  hasAnyMeeting: boolean;
  matchedUrls: string[];
  meetingsWithBrowser: MeetingUrlWithBrowser[];
  automationAvailable?: boolean;
}

interface UseBrowserMeetingsReturn {
  browserMeetings: BrowserMeetingsData | null;
  isAvailable: boolean;
  automationAvailable: boolean;
}

export const useBrowserMeetings = (): UseBrowserMeetingsReturn => {
  const { user } = useAuth();
  const [browserMeetings, setBrowserMeetings] =
    useState<BrowserMeetingsData | null>(null);
  const [automationAvailable, setAutomationAvailable] =
    useState<boolean>(false);

  // Only available on desktop platforms with Electron and when user is logged in
  const isAvailable = isDesktop && !!user;

  useEffect(() => {
    if (!isAvailable) {
      return;
    }

    // Listen for browser meeting changes from main process
    const cleanup = window.electron?.browserMeetings.onMeetingsChanged(
      (data: BrowserMeetingsData) => {
        setBrowserMeetings(data);
        if (typeof data.automationAvailable === "boolean") {
          setAutomationAvailable(data.automationAvailable);
        }
      },
    );

    // Get initial state
    window.electron?.browserMeetings
      .scan()
      .then((initialData) => {
        setBrowserMeetings(initialData);
        if (typeof initialData.automationAvailable === "boolean") {
          setAutomationAvailable(initialData.automationAvailable);
        } else {
          // Fallback: check explicitly once
          window.electron?.browserMeetings
            .isAutomationAvailable()
            .then((ok) => setAutomationAvailable(!!ok))
            .catch(() => setAutomationAvailable(false));
        }
      })
      .catch((error) => {
        console.error("[BrowserMeetings] Failed to get initial scan:", error);
      });

    return cleanup;
  }, [isAvailable]);

  return {
    browserMeetings,
    isAvailable,
    automationAvailable,
  };
};
