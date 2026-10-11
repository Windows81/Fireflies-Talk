import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storage } from "@/features/storage";
import {
  GetPersonalAssistantForDailyBriefNotificationDocument,
  apolloClient,
} from "@/graphql";
import { useAuth } from "@/features/auth";
import { DAILY_BRIEF_APP_TITLE } from "@/constants";
import { getLocalSettings } from "@/features/settings";
import { isDesktop, isMainDesktopWindow } from "@/utils/device";
import { showDesktopNotification } from "./utils";
import { isBriefCreatedToday } from "./dailyBriefReadiness";
import { Logger } from "@/logger";

const logger = new Logger("daily-brief-notification");

const NOTIFICATION_TITLE = "Your daily brief is ready";
const NOTIFICATION_BODY =
  "Catch-up on your meeting insights before your day begins.";
const NOTIFICATION_ACTION = "View Brief";
const START_HOUR = 8;
const END_HOUR = 13;
// Retry delay while waiting in-window: user idle (covers Windows where
// returning from idle fires no event) or brief not generated yet
const RETRY_MS = 5 * 60_000;

interface DailyBriefState {
  lastShownDateByUserId: Record<string, string>;
  setLastShownDate: (userId: string, dateKey: string) => void;
}

export const useDailyBriefNotificationStore = create(
  persist<DailyBriefState>(
    (set) => ({
      lastShownDateByUserId: {},
      setLastShownDate: (userId, dateKey) =>
        set((state) => ({
          lastShownDateByUserId: {
            ...state.lastShownDateByUserId,
            [userId]: dateKey,
          },
        })),
    }),
    {
      name: "desktop-daily-brief-notification",
      storage: createJSONStorage(() => storage),
    },
  ),
);

// --- Pure helpers ---

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function msUntilHour(hour: number): number {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, 0, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

function buildPath(title: string, id: string): string {
  const encoded = encodeURIComponent(title.trim() || DAILY_BRIEF_APP_TITLE);
  return `/welcome/ai-skills/${encoded}:${id}`;
}

function alreadyShownToday(userId: string): boolean {
  const { lastShownDateByUserId } = useDailyBriefNotificationStore.getState();
  return lastShownDateByUserId[userId] === todayKey();
}

async function isUserActive(): Promise<boolean> {
  try {
    const state = await window.electron?.app?.getSystemIdleState?.(60);
    return state === "active";
  } catch {
    return false;
  }
}

// --- Singleton lifecycle ---

let cleanupUserActive: (() => void) | null = null;
let morningTimeout: ReturnType<typeof setTimeout> | null = null;
let retryTimeout: ReturnType<typeof setTimeout> | null = null;
let running = false;
let initialized = false;

function clearMorningTimeout(): void {
  if (morningTimeout) {
    clearTimeout(morningTimeout);
    morningTimeout = null;
  }
}

function clearRetry(): void {
  if (retryTimeout) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }
}

function scheduleRetry(): void {
  clearRetry();
  retryTimeout = setTimeout(() => void attempt(), RETRY_MS);
}

/**
 * Schedule a timeout for 8AM so we can attempt then.
 * If user is idle at that moment, onUserBecameActive will handle it later.
 */
function scheduleForMorning(): void {
  clearMorningTimeout();
  morningTimeout = setTimeout(() => void attempt(), msUntilHour(START_HOUR));
}

async function attempt(): Promise<void> {
  if (running || !initialized) return;
  running = true;

  try {
    const userId = useAuth.getState().user?.id;
    if (!userId || alreadyShownToday(userId)) return;
    if (!getLocalSettings().dailyBriefNotification) return;

    const hour = new Date().getHours();

    // Before window — schedule for 8AM, then onUserBecameActive takes over if idle
    if (hour < START_HOUR) {
      scheduleForMorning();
      return;
    }

    // Past window — wait for next morning
    if (hour >= END_HOUR) {
      scheduleForMorning();
      return;
    }

    // In window — user must be active right now
    if (!(await isUserActive())) {
      scheduleRetry();
      return;
    }
    clearRetry();

    const { data } = await apolloClient.query({
      query: GetPersonalAssistantForDailyBriefNotificationDocument,
      fetchPolicy: "network-only",
    });
    // `dailyDigest` is the server schema field name for the Daily Brief app
    const brief = data?.getPersonalAssistant?.dailyDigest;
    const settings = brief?.appSettings;
    if (!settings?.active) return;

    // Backend hasn't generated today's brief yet — retry until it exists
    // (next attempt past END_HOUR reschedules for tomorrow morning)
    if (!isBriefCreatedToday(brief?.lastOutputCreatedAt)) {
      scheduleRetry();
      return;
    }

    const shown = await showDesktopNotification(
      NOTIFICATION_TITLE,
      NOTIFICATION_BODY,
      buildPath(settings.title, settings.id),
      NOTIFICATION_ACTION,
      "daily_brief",
    );
    if (!shown) return;

    useDailyBriefNotificationStore
      .getState()
      .setLastShownDate(userId, todayKey());
  } catch (error) {
    logger.error("[DAILY_BRIEF] Failed to show notification", {
      error,
    });
  } finally {
    running = false;
    // Always schedule next morning — covers errors, !active, !shown, and success
    scheduleForMorning();
  }
}

/**
 * Start the daily brief notification system.
 * Trigger: powerMonitor unlock-screen / user-did-become-active (via IPC).
 * If app starts before 8AM, schedules a timeout for 8AM.
 * No polling. Idempotent. Desktop-only.
 */
export function initDailyBriefNotifications(): void {
  if (initialized || !isDesktop || !isMainDesktopWindow()) return;
  initialized = true;

  cleanupUserActive =
    window.electron?.onUserBecameActive?.(() => {
      void attempt();
    }) ?? null;

  void attempt();
}

export function disposeDailyBriefNotifications(): void {
  clearMorningTimeout();
  clearRetry();
  cleanupUserActive?.();
  cleanupUserActive = null;
  initialized = false;
}
