import { getErrorMessage } from "@/errors";
import { useAuth } from "@/features/auth";
import * as AiPin from "@/modules/ai-pin";
import type {
  AiPinDevice,
  AiPinDownloadProgress,
  AiPinRecordingEvent,
} from "@/modules/ai-pin";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform, type AppStateStatus } from "react-native";
import {
  connectedStateFromStatus,
  isAiPinTransferError,
  loadTrustedDevice,
  nextReconnect,
  removeTrustedDevice,
  requestNearbyPermission,
  saveTrustedDevice,
  type TrustedDevice,
} from "./controller-utils";
import { modeAfterRecordingEvent, recordingJustStopped } from "./panel-state";
import { DISABLED_STATE, type AiPinControllerState } from "./types";
import { useAiPinSync } from "./useAiPinSync";
import { useTrackedTimeouts } from "./useTrackedTimeouts";

const DEVICE_ABSENCE_MS = 4_000;

export function useAiPinController(enabled = true) {
  const userId = useAuth((auth) => auth.user?.id);
  const [state, setState] = useState<AiPinControllerState>({
    connectionState: "disconnected",
    sheetMode: "hidden",
  });
  const stateRef = useRef(state);
  const trustedRef = useRef<TrustedDevice | undefined>(undefined);
  const lastSeenAtRef = useRef<Record<string, number>>({});
  const suppressedDeviceRef = useRef<string | undefined>(undefined);
  const connectingRef = useRef(false);
  const reconnectRef = useRef({ failures: 0, nextAt: 0 });
  const permissionRef = useRef(false);
  const generationRef = useRef(0);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const updateState = useCallback((partial: Partial<AiPinControllerState>) => {
    // Native BLE events can arrive in the same frame. Keep event handlers on
    // the latest transition so a stale callback cannot reopen or dismiss UI.
    stateRef.current = { ...stateRef.current, ...partial };
    setState((current) => {
      const next = { ...current, ...partial };
      stateRef.current = next;
      return next;
    });
  }, []);

  const { schedule, clearTimers } = useTrackedTimeouts();

  const runSync = useAiPinSync({
    enabled,
    userId,
    generationRef,
    stateRef,
    updateState,
  });

  const connect = useCallback(
    async (
      device = stateRef.current.device,
      options: { automatic?: boolean } = {},
    ) => {
      if (!device || connectingRef.current || !userId || !enabled) return;
      const now = Date.now();
      if (options.automatic && now < reconnectRef.current.nextAt) return;
      connectingRef.current = true;
      const openedMode = stateRef.current.sheetMode;
      updateState({
        device,
        connectionState: "connecting",
        sheetMode: options.automatic ? openedMode : "connecting",
        error: undefined,
      });
      try {
        const status = await AiPin.connect(device.id);
        const trusted = { id: device.id, serial: status.serial };
        trustedRef.current = trusted;
        reconnectRef.current = { failures: 0, nextAt: 0 };
        await saveTrustedDevice(userId, trusted);
        const automaticMode =
          openedMode === "details" || openedMode === "recording"
            ? status.recording
              ? "recording"
              : "details"
            : openedMode;
        updateState({
          ...connectedStateFromStatus(status),
          sheetMode: options.automatic
            ? automaticMode
            : status.recording
              ? "recording"
              : "connected",
        });
        if (status.serial) void runSync(status.serial);
        if (!options.automatic) {
          schedule(() => {
            if (stateRef.current.sheetMode === "connected") {
              updateState({ sheetMode: "hidden" });
            }
          }, 1800);
        }
      } catch (error) {
        reconnectRef.current = nextReconnect(reconnectRef.current.failures);
        updateState({
          connectionState: "disconnected",
          serial: undefined,
          batteryLevel: undefined,
          error: getErrorMessage(error, "Could not connect to the AI Pin"),
          sheetMode: options.automatic ? "hidden" : "error",
        });
      } finally {
        connectingRef.current = false;
      }
    },
    [enabled, runSync, schedule, updateState, userId],
  );

  useEffect(() => {
    if (
      !enabled ||
      (Platform.OS !== "android" && Platform.OS !== "ios") ||
      !AiPin.isAiPinAvailable ||
      !userId
    ) {
      return;
    }
    const generation = ++generationRef.current;
    let active = true;
    const isActive = () =>
      active &&
      generationRef.current === generation &&
      useAuth.getState().user?.id === userId;

    const startScan = () => {
      if (isActive() && AppState.currentState === "active") {
        void AiPin.startScan().catch(() => {});
      }
    };
    const subscriptions = [
      AiPin.addAiPinEventListener("deviceDiscovered", (event: AiPinDevice) => {
        if (!isActive()) return;
        const now = Date.now();
        const lastSeenAt = lastSeenAtRef.current[event.id] ?? 0;
        if (
          now - lastSeenAt > DEVICE_ABSENCE_MS &&
          suppressedDeviceRef.current === event.id
        ) {
          suppressedDeviceRef.current = undefined;
        }
        lastSeenAtRef.current[event.id] = now;
        if (
          stateRef.current.connectionState !== "disconnected" ||
          suppressedDeviceRef.current === event.id
        ) {
          return;
        }
        if (trustedRef.current?.id === event.id) {
          void connect(event, { automatic: true });
        } else if (
          stateRef.current.sheetMode !== "detected" ||
          stateRef.current.device?.id !== event.id
        ) {
          updateState({
            device: event,
            sheetMode: "detected",
            error: undefined,
          });
        }
      }),
      AiPin.addAiPinEventListener("connectionChanged", (event) => {
        if (!isActive()) return;
        if (event.state === "disconnected") {
          updateState({
            connectionState: "disconnected",
            serial: undefined,
            batteryLevel: undefined,
            recording: undefined,
            sync: undefined,
            sheetMode:
              stateRef.current.sheetMode === "details" ||
              stateRef.current.sheetMode === "recording"
                ? "hidden"
                : stateRef.current.sheetMode,
          });
          schedule(startScan, 1200);
          return;
        }
        updateState({
          connectionState: event.state,
          serial: event.serial,
          batteryLevel: event.batteryLevel,
        });
      }),
      AiPin.addAiPinEventListener("batteryChanged", (event) => {
        if (isActive()) updateState({ batteryLevel: event.batteryLevel });
      }),
      AiPin.addAiPinEventListener(
        "recordingChanged",
        (event: AiPinRecordingEvent) => {
          if (!isActive()) return;
          const current = stateRef.current;
          const wasActive = Boolean(current.recording?.active);
          const sheetMode = modeAfterRecordingEvent(
            current.sheetMode,
            event.active,
          );
          updateState({ recording: event, sheetMode });
          const serial = current.serial;
          if (recordingJustStopped(wasActive, event.active) && serial)
            schedule(() => void runSync(serial), 400);
        },
      ),
      AiPin.addAiPinEventListener(
        "downloadProgress",
        (event: AiPinDownloadProgress) => {
          if (!isActive()) return;
          const sync = stateRef.current.sync;
          if (
            sync?.phase === "downloading" &&
            sync.filename === event.filename
          ) {
            updateState({ sync: { ...sync, progress: event.progress } });
          }
        },
      ),
      AiPin.addAiPinEventListener("error", (event) => {
        if (
          !isActive() ||
          event.code === "recording_active" ||
          // Bluetooth off or permission denied is a background condition the
          // user did not ask about; never open the sheet for it.
          event.code === "bluetooth_unavailable" ||
          (Boolean(stateRef.current.sync) && isAiPinTransferError(event.code))
        )
          return;
        updateState({ error: event.message, sheetMode: "error" });
      }),
    ];

    const reconcile = async (appState: AppStateStatus) => {
      if (!isActive() || !permissionRef.current) return;
      if (appState !== "active") {
        await AiPin.stopScan();
        return;
      }
      const status = AiPin.getStatus();
      if (status.connectionState === "connected") {
        updateState({
          ...connectedStateFromStatus(status),
        });
        if (!status.recording && status.serial) void runSync(status.serial);
      } else {
        await AiPin.startScan();
      }
    };
    const appStateSubscription = AppState.addEventListener("change", (next) => {
      void reconcile(next).catch(() => {});
    });

    void (async () => {
      trustedRef.current = await loadTrustedDevice(userId);
      permissionRef.current = await requestNearbyPermission();
      if (!permissionRef.current) return;
      await reconcile(AppState.currentState);
    })().catch(() => {});

    return () => {
      active = false;
      permissionRef.current = false;
      if (generationRef.current === generation) {
        generationRef.current = generation + 1;
      }
      appStateSubscription.remove();
      subscriptions.forEach((subscription) => subscription.remove());
      clearTimers();

      // Preserve the native BLE session across Fast Refresh and navigator
      // remounts. Release it when the account or feature actually changes.
      const accountChanged = useAuth.getState().user?.id !== userId;
      if (accountChanged || !enabledRef.current) {
        void AiPin.stopScan().catch(() => {});
        void AiPin.disconnect().catch(() => {});
      }
    };
  }, [clearTimers, connect, enabled, runSync, schedule, updateState, userId]);

  const dismiss = useCallback(() => {
    suppressedDeviceRef.current = stateRef.current.device?.id;
    updateState({ sheetMode: "hidden", error: undefined });
  }, [updateState]);

  const openEntry = useCallback(() => {
    if (!enabled) return;
    const current = stateRef.current;
    const nativeStatus = AiPin.getStatus();
    if (nativeStatus.connectionState === "connected") {
      updateState({
        ...connectedStateFromStatus(
          nativeStatus,
          current.recording?.durationMillis,
        ),
        sheetMode: nativeStatus.recording ? "recording" : "details",
        error: undefined,
      });
    } else if (current.device && trustedRef.current?.id === current.device.id) {
      void connect(current.device).then(() => {
        const status = AiPin.getStatus();
        if (status.connectionState === "connected") {
          updateState({
            sheetMode: status.recording ? "recording" : "details",
            error: undefined,
          });
        }
      });
    } else if (current.error) {
      updateState({ sheetMode: "error" });
    } else if (current.device) {
      updateState({ sheetMode: "detected", error: undefined });
    } else {
      void AiPin.startScan().catch(() => {});
    }
  }, [connect, enabled, updateState]);

  const retry = useCallback(() => {
    if (!enabled) return;
    reconnectRef.current = { failures: 0, nextAt: 0 };
    const current = stateRef.current;
    if (current.connectionState === "connected" && current.serial) {
      updateState({ error: undefined, sheetMode: "details" });
      void runSync(current.serial);
      return;
    }
    if (stateRef.current.device) {
      void connect(stateRef.current.device);
      return;
    }
    void requestNearbyPermission().then((granted) => {
      permissionRef.current = granted;
      if (granted) {
        updateState({ sheetMode: "hidden", error: undefined });
        void AiPin.startScan();
      }
    });
  }, [connect, enabled, runSync, updateState]);

  const disconnect = useCallback(async () => {
    suppressedDeviceRef.current = stateRef.current.device?.id;
    await AiPin.disconnect();
    trustedRef.current = undefined;
    if (userId) await removeTrustedDevice(userId);
    updateState({
      connectionState: "disconnected",
      serial: undefined,
      batteryLevel: undefined,
      recording: undefined,
      sync: undefined,
      sheetMode: "hidden",
    });
  }, [updateState, userId]);

  const syncNow = useCallback(() => {
    if (!enabled) return;
    if (stateRef.current.recording?.active || AiPin.getStatus().recording)
      return;
    const serial = stateRef.current.serial;
    if (serial) void runSync(serial);
    updateState({ sheetMode: "hidden" });
  }, [enabled, runSync, updateState]);

  return {
    state: enabled ? state : DISABLED_STATE,
    connect,
    dismiss,
    openEntry,
    retry,
    disconnect,
    syncNow,
  };
}
