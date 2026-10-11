/**
 * Centralized meeting state cleanup manager.
 * Periodically resets meeting-related state to prevent memory leaks from
 * accumulated meeting IDs, URLs, and other tracking data.
 */

import { Logger } from "@/logger";

const logger = new Logger("meeting-state-cleanup");

const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

type CleanupCallback = () => void;

const cleanupCallbacks = new Set<CleanupCallback>();
let cleanupInterval: ReturnType<typeof setInterval> | null = null;
let isInitialized = false;

/**
 * Register a cleanup callback to be called during periodic cleanup.
 * Returns an unregister function.
 */
export function registerCleanupCallback(callback: CleanupCallback): () => void {
  cleanupCallbacks.add(callback);
  return () => {
    cleanupCallbacks.delete(callback);
  };
}

/**
 * Run all registered cleanup callbacks.
 */
function runCleanup(): void {
  logger.info("Running periodic meeting state cleanup", {
    callbackCount: cleanupCallbacks.size,
  });

  cleanupCallbacks.forEach((callback) => {
    try {
      callback();
    } catch (error) {
      logger.error("Cleanup callback failed", { error });
    }
  });
}

/**
 * Initialize the cleanup interval. Safe to call multiple times.
 */
export function initializeMeetingStateCleanup(): void {
  if (isInitialized) return;
  isInitialized = true;

  cleanupInterval = setInterval(runCleanup, CLEANUP_INTERVAL_MS);
  logger.info("Meeting state cleanup initialized", {
    intervalMs: CLEANUP_INTERVAL_MS,
  });
}

/**
 * Stop the cleanup interval and clear all callbacks.
 */
export function stopMeetingStateCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  cleanupCallbacks.clear();
  isInitialized = false;
}
