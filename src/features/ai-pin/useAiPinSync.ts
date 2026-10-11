import { getErrorMessage } from "@/errors";
import { useAuth } from "@/features/auth";
import * as AiPin from "@/modules/ai-pin";
import { useCallback, useRef } from "react";
import { syncAiPinRecordings } from "./sync";
import type { AiPinControllerState } from "./types";

interface CurrentRef<T> {
  current: T;
}

interface AiPinSyncOptions {
  enabled: boolean;
  userId?: string;
  generationRef: CurrentRef<number>;
  stateRef: CurrentRef<AiPinControllerState>;
  updateState: (partial: Partial<AiPinControllerState>) => void;
}

function isRecordingDeferral(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "recording_active"
  );
}

function isErrorLike(error: unknown): error is Error | { message: string } {
  return (
    error instanceof Error ||
    (typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string")
  );
}

export function useAiPinSync({
  enabled,
  userId,
  generationRef,
  stateRef,
  updateState,
}: AiPinSyncOptions) {
  const queuedSerialRef = useRef<string | undefined>(undefined);
  const drainRef = useRef<
    { userId: string; promise: Promise<void>; token: object } | undefined
  >(undefined);

  const runSync = useCallback(
    (serial: string) => {
      if (!userId || !enabled) return;
      queuedSerialRef.current = serial;
      if (stateRef.current.recording?.active || AiPin.getStatus().recording) {
        updateState({ sync: undefined });
        return drainRef.current?.promise;
      }
      if (drainRef.current?.userId === userId) {
        return drainRef.current.promise;
      }

      const generation = generationRef.current;
      const token = {};
      const isCurrent = () =>
        generationRef.current === generation &&
        useAuth.getState().user?.id === userId;
      const isConnectedTo = (expectedSerial: string) =>
        isCurrent() &&
        stateRef.current.connectionState === "connected" &&
        stateRef.current.serial === expectedSerial;
      const defer = (nextSerial: string) => {
        queuedSerialRef.current = nextSerial;
        updateState({ sync: undefined });
      };
      const operation = (async () => {
        while (isCurrent()) {
          const nextSerial = queuedSerialRef.current;
          if (!nextSerial) return;
          queuedSerialRef.current = undefined;
          if (!isConnectedTo(nextSerial)) continue;
          if (AiPin.getStatus().recording) {
            defer(nextSerial);
            return;
          }
          updateState({ sync: { phase: "listing", completed: 0, total: 0 } });
          try {
            await syncAiPinRecordings(userId, nextSerial, (sync) => {
              if (isConnectedTo(nextSerial)) updateState({ sync });
            });
          } catch (error) {
            if (!isCurrent()) return;
            if (!isConnectedTo(nextSerial)) continue;
            if (AiPin.getStatus().recording || isRecordingDeferral(error)) {
              defer(nextSerial);
              return;
            }
            if (queuedSerialRef.current) continue;
            updateState({
              error: isErrorLike(error)
                ? getErrorMessage(error, "AI Pin sync failed")
                : "AI Pin sync failed",
              sheetMode: "error",
              sync: undefined,
            });
            return;
          }
        }
      })().finally(() => {
        if (drainRef.current?.token === token) drainRef.current = undefined;
      });
      drainRef.current = { userId, promise: operation, token };
      return operation;
    },
    [enabled, generationRef, stateRef, updateState, userId],
  );

  return runSync;
}
