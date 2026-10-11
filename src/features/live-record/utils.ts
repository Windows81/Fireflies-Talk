import * as AudioRecord from "@/modules/audio-record";
import { AudioRecordErrorCode } from "@/modules/audio-record";
import { format } from "date-fns";
import type {
  LocalRecordingFile,
  RecordingContext,
  RecordingStates,
} from "./types";
import { openStoreUrl } from "@/utils/updates";
import { promptConfirmation } from "@/components/Dialog";
import { useCallback } from "react";
import { Linking, Platform, PermissionsAndroid } from "react-native";
import { Logger } from "@/logger";
import { hasMinimumDiskSpace } from "@/utils/file";
import {
  getActualPlatform,
  isDesktop,
  shouldUseCoreAudioTap,
} from "@/utils/device";
import { SystemAudioPermissionDeniedError } from "./errors";

export const permissionDeniedCanAskAgainError = new Error(
  "Allow access to microphone to continue",
);

export const permissionDeniedError = new Error(
  "Open settings and allow access to microphone to continue",
);

/**
 * Checks system audio permissions for desktop recording.
 * On macOS 14.2+, checks kTCCServiceAudioCapture (CoreAudioTap).
 * On older macOS, checks screen recording permission (ScreenCaptureKit).
 *
 * If permission is denied, opens settings and throws SystemAudioPermissionDeniedError.
 * If permission is not-determined or granted, returns true (recording can proceed).
 *
 * @returns Promise<boolean> - true if system audio can be captured
 * @throws SystemAudioPermissionDeniedError if permission is denied
 */
export async function checkSystemAudioPermissionOrFail(): Promise<boolean> {
  if (!isDesktop || !window?.electron?.permissions) {
    // Not on desktop, system audio not applicable
    return true;
  }

  const useCoreAudioTap = await shouldUseCoreAudioTap();

  logger.info("checkSystemAudioPermissionOrFail: checking", {
    useCoreAudioTap,
  });

  if (useCoreAudioTap) {
    // macOS 14.2+ uses CoreAudioTap with kTCCServiceAudioCapture permission
    const status = await window.electron.permissions.check("systemAudio");
    logger.info("checkSystemAudioPermissionOrFail: systemAudio status", {
      status,
    });

    if (status === "denied") {
      // Permission explicitly denied - open settings
      window.electron.permissions.openSettings("systemAudio");
      throw new SystemAudioPermissionDeniedError("systemAudio");
    }

    // "granted" or "not-determined" - proceed (will prompt if needed)
    return true;
  } else {
    // Older macOS uses ScreenCaptureKit with screen recording permission
    const status = await window.electron.permissions.check("screen");
    logger.info("checkSystemAudioPermissionOrFail: screen status", { status });

    if (status === "denied") {
      // Permission explicitly denied - open settings
      window.electron.permissions.openSettings("screen");
      throw new SystemAudioPermissionDeniedError("screen");
    }

    // "granted" or "not-determined" - proceed (will prompt if needed)
    return true;
  }
}

export async function requestMicrophonePermissionOrFail() {
  logger.info("requestMicrophonePermissionOrFail: start", {
    platform: getActualPlatform(),
  });

  if (getActualPlatform() === "darwin") {
    const result = await window.electron?.permissions.check("microphone");
    logger.info("requestMicrophonePermissionOrFail: check result", { result });

    if (result === "denied") {
      logger.warn("requestMicrophonePermissionOrFail: denied, never ask again");
      throw permissionDeniedError;
    }

    if (result === "not-determined") {
      // Explicitly request via systemPreferences.askForMediaAccess so the
      // macOS TCC dialog is shown from the main process. In sandboxed release
      // builds the renderer's getUserMedia() may not trigger the OS prompt,
      // leaving TCC stuck at "not-determined".
      const granted = await window.electron?.permissions.request("microphone");
      logger.info("requestMicrophonePermissionOrFail: request result", {
        granted,
      });
      if (!granted) {
        throw permissionDeniedError;
      }
    }

    return true;
  }

  if (getActualPlatform() === "win32") {
    const result = await window.electron?.permissions.check("microphone");
    logger.info("requestMicrophonePermissionOrFail: check result", { result });

    if (result === "denied") {
      // On Windows, microphone permission can't be requested programmatically.
      // Open Windows Settings so the user can enable "Let desktop apps access your microphone".
      logger.warn(
        "requestMicrophonePermissionOrFail: denied on Windows, opening settings",
      );
      window.electron?.permissions.openSettings("microphone");
      throw permissionDeniedError;
    }

    return true;
  }

  // Use React Native's built-in permission handler on Android
  if (Platform.OS === "android") {
    try {
      const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;

      const alreadyGranted = await PermissionsAndroid.check(permission);
      if (alreadyGranted) {
        logger.info("requestMicrophonePermissionOrFail: already granted");
        return true;
      }

      logger.info(
        "requestMicrophonePermissionOrFail: requesting Android permission",
      );
      const result = await PermissionsAndroid.request(permission, {
        title: "Microphone access required",
        message: "Fireflies needs access to your microphone to record audio.",
        buttonPositive: "Allow",
        buttonNegative: "Deny",
        buttonNeutral: "Ask me later",
      });

      logger.info("requestMicrophonePermissionOrFail: request result", {
        result,
      });

      if (result === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      }

      if (result === PermissionsAndroid.RESULTS.DENIED) {
        logger.warn("requestMicrophonePermissionOrFail: denied, can ask again");
        throw permissionDeniedCanAskAgainError;
      }

      if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        logger.warn(
          "requestMicrophonePermissionOrFail: denied, never ask again",
        );
        throw permissionDeniedError;
      }

      logger.warn(
        "requestMicrophonePermissionOrFail: denied with unknown result",
      );
      throw permissionDeniedCanAskAgainError;
    } catch (err) {
      logger.warn(
        "requestMicrophonePermissionOrFail: error during request",
        err,
      );
      throw err;
    }
  }

  // Fallback for iOS/web/other: delegate to module helper (shows system prompt on iOS)
  const { granted, canAskAgain } =
    await AudioRecord.requestRecordingPermissions();
  logger.info("requestMicrophonePermissionOrFail: module result", {
    granted,
    canAskAgain,
  });
  if (!granted) {
    if (canAskAgain) {
      throw permissionDeniedCanAskAgainError;
    }
    throw permissionDeniedError;
  }
  return true;
}

/**
 * Gets the filename for display purposes (shows actual extension).
 */
export const getFileName = (file: LocalRecordingFile): string => {
  return file.context?.title || file.uri.split("/").pop() || "";
};

/**
 * Gets the filename for download with .weba normalized to .webm.
 * Safari and Firefox have better compatibility with .webm extension in HTML5 file pickers.
 */
export const getDownloadFileName = (file: LocalRecordingFile): string => {
  const fileName = getFileName(file);
  // Normalize .weba to .webm for download compatibility
  if (fileName.endsWith(".weba")) {
    return fileName.replace(/\.weba$/, ".webm");
  }
  return fileName;
};

export const getNonRawFileUri = (file: LocalRecordingFile) => {
  if (!file.extensionInfo.isRaw) {
    return file.uri;
  }
  return (
    file.uri.substring(
      0,
      file.uri.length - file.extensionInfo.extension.length,
    ) + file.extensionInfo.containedExtension
  );
};

export const getDefaultRecordingTitle = (startTime: Date) => {
  return format(startTime, "MMM dd, hh:mm aa");
};

/**
 * The title the user picked for the active recording, or "" while the meeting
 * still carries the auto-generated date title from auto-start.
 */
export const getUserRecordingTitle = (
  ctx: Pick<RecordingContext, "title" | "startTime"> | null,
): string => {
  if (!ctx?.title) return "";
  if (
    ctx.startTime &&
    ctx.title === getDefaultRecordingTitle(new Date(ctx.startTime))
  ) {
    return "";
  }
  return ctx.title;
};

export const getRecordingErrorSentryFingerprint = (err: {
  code?: string;
  message: string;
}) => {
  // many errors got grouped as Internal so we use the message to differentiate
  if (err.code && err.code !== AudioRecordErrorCode.ErrInternal) {
    return ["{{ default }}", err.code];
  }
  return ["{{ default }}", err.message];
};

export const warnNewUpdatesBeforeRecording = () =>
  new Promise<boolean>((resolve) => {
    promptConfirmation({
      title: "A new version is available",
      children:
        "Recording with an outdated version of the app may lead to data loss.",
      cancelText: "Record anyway",
      confirmText: "Update now",
      onCancel: () => resolve(true),
      onConfirm: () => {
        resolve(false);
        openStoreUrl();
      },
    });
  });

export const isPendingStreaming = (status: RecordingStates) =>
  (status.state === "inactive" && status.streamingState !== "inactive") ||
  !!status.streamingError;

const logger = new Logger("live-record-utils");

// MARK: - Web codec selection utilities
export const isWeb = () => typeof window !== "undefined";

export function selectOptimalWebAudioMime(recordingOptions?: {
  preferMp4?: boolean;
}): string | undefined {
  if (!isWeb() || !window.MediaRecorder) return undefined;
  const isTypeSupported = window.MediaRecorder.isTypeSupported?.bind(
    window.MediaRecorder,
  );

  // If support detection is unavailable, prefer the safe MP4 path
  if (!isTypeSupported) return "audio/mp4";

  const tryTypes = (types: string[]): string | undefined => {
    for (const t of types) {
      try {
        if (isTypeSupported && isTypeSupported(t)) return t;
      } catch (err) {
        logger.warn("selectOptimalWebAudioMime: error trying type", { t, err });
      }
    }
    return undefined;
  };

  const preferMp4 = !!recordingOptions?.preferMp4;

  // Try WebM with Opus first (most widely supported for audio recording)
  const webm = tryTypes(["audio/webm;codecs=opus", "audio/webm"]);
  const ogg = tryTypes(["audio/ogg;codecs=opus", "audio/ogg"]);
  const mp4 = tryTypes(["audio/mp4;codecs=mp4a.40.2", "audio/mp4"]);

  if (preferMp4) {
    // MP4 first for Safari/iOS compatibility
    if (mp4) return mp4;
    if (webm) return webm;
    if (ogg) return ogg;
    return undefined;
  }

  // WebM first for best MediaRecorder API compatibility across Chrome/Firefox/modern Safari
  if (webm) return webm;
  if (ogg) return ogg;
  if (mp4) return mp4;
  return undefined;
}

/**
 * Hook for checking disk storage before recording
 * @param minRequiredMB - Minimum required storage in MB (default: 300MB)
 * @returns Function that checks storage and shows dialog if needed
 */
export const useStorageCheck = (minRequiredMB = 300) => {
  const checkStorageBeforeRecording =
    useCallback(async (): Promise<boolean> => {
      try {
        const minRequiredBytes = minRequiredMB * 1024 * 1024;

        if (Platform.OS === "web") {
          // Web doesn't have disk space concept
          return true;
        }

        const hasEnoughSpace = await hasMinimumDiskSpace(minRequiredBytes);

        if (!hasEnoughSpace) {
          return new Promise<boolean>((resolve) => {
            promptConfirmation({
              title: "Low internal storage",
              children: `Your device doesn't have enough space to record. Please free up space and try again.`,
              confirmText: "Manage Storage",
              onConfirm: () => {
                openStorageSettings();
                resolve(false);
              },
              cancelText: "Cancel",
              onCancel: () => resolve(false),
            });
          });
        }

        return true;
      } catch (error) {
        // If we can't check storage, don't block recording
        logger.warn("Could not check disk storage:", error);
        return true;
      }
    }, [minRequiredMB]);

  return checkStorageBeforeRecording;
};

/**
 * Opens platform-specific storage settings
 */
const openStorageSettings = () => {
  if (Platform.OS === "ios") {
    const iosVersion = Number.parseFloat(Platform.Version as string);
    const storageUrl =
      iosVersion <= 18.3
        ? "App-prefs:General&path=STORAGE_MGMT"
        : "settings-navigation://com.apple.Settings.General/STORAGE_MGMT";

    Linking.openURL(storageUrl).catch(() => {
      Linking.openSettings();
    });
  } else if (Platform.OS === "android") {
    Linking.sendIntent("android.settings.INTERNAL_STORAGE_SETTINGS").catch(
      () => {
        Linking.openSettings();
      },
    );
  }
};
