import type { DictationScreenContext } from "electron/src/types";
import { Config } from "@/constants";
import { useAuth } from "@/features/auth";
import { getLocalSettings } from "@/features/settings";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import {
  cleanupDictationText,
  type DictationCleanupResult,
} from "./dictationCleanup";
import type { DictationProcessorDeps } from "./dictationProcessorDeps";
import {
  DICTATION_PROCESSING_TIMEOUT_MS,
  withCommandTimeout,
  withTimeout,
} from "./dictationCommandTimeout";
import { runDetachableActionCommand } from "./dictationDetachableCommand";
import {
  formatDictationServiceError,
  notifyCommandAction,
  notifyDictationError,
} from "./dictationErrors";
import { dictationEmailAssistantNudgeApi } from "@/features/dictation-email-assistant-nudge";
import { dictationSlackAssistantNudgeApi } from "@/features/dictation-slack-assistant-nudge";
import { dictationFeedbackNudgeApi } from "@/features/dictation-feedback-nudge";
import { addDictationEntry } from "./dictationHistory";
import type { DictationEntry } from "./dictationHistoryEntries";
import {
  deliverDictationInApp,
  isDictationInAppCapture,
  isDictationRecordingInApp,
} from "./dictationInAppCapture";
import {
  formatCommandResultLogLine,
  formatCommandSttLogLine,
  formatDictatedLogLine,
} from "./dictationLogLines";
import { historyEntryAfterPaste } from "./dictationPasteHistory";
import { unmarkPastedWhenMissed } from "./dictationPasteMissed";
import { resolvePasteTarget } from "./dictationPasteTarget";
import { resolveDictatedPasteText } from "./dictationPasteText";
import {
  awaitScreenContextOutcome,
  type ScreenContextOutcome,
} from "./dictationScreenContextWait";
import type { DictationCommitResult } from "./dictationSession";
import { shouldSkipTranscription } from "./dictationSpeechGate";
import {
  formatDictationReleaseTiming,
  getDictationReleaseTotalMs,
} from "./dictationTiming";
import {
  buildDictationPastedProperties,
  pasteTargetFromResult,
  type DictationPastedTrackingProperties,
} from "./dictationTracking";
import {
  createDictationWorkGate,
  type DictationWorkHandle,
} from "./dictationWorkGate";

/**
 * Every completed dictation lands here: it joins the history and counts
 * toward the one-off feedback nudge, toward the Email Assistant nudge when
 * it was pasted into an email client, and toward the Slack Assistant nudge
 * when it was pasted into Slack.
 */
const saveDictationEntry = (entry: DictationEntry) => {
  addDictationEntry(entry);
  dictationFeedbackNudgeApi.recordDictation(entry);
  dictationEmailAssistantNudgeApi.recordDictation(entry);
  dictationSlackAssistantNudgeApi.recordDictation(entry);
};

export function createDictationProcessor(deps: DictationProcessorDeps) {
  const workGate = createDictationWorkGate();

  const finishIfOwner = (started: DictationWorkHandle) => {
    workGate.runIfOwner(started.generation, () => {
      deps.releaseTimingRef.current = null;
      deps.resetRecordingClock();
      deps.speechGateRef.current = null;
      deps.screenContextPromiseRef.current = null;
      deps.setState("idle");
    });
  };

  // A dictation's capture ran during its recording, so it gets a brief wait.
  // Polishing has no recording: its capture starts with it and is awaited.
  const resolveScreenContext = async (
    capturedWhileRecording: boolean,
  ): Promise<ScreenContextOutcome> => {
    if (!getLocalSettings().useScreenContextForDictation) {
      return { context: null, missed: false };
    }
    const capture = deps.getScreenContextCapture();
    if (!capturedWhileRecording) {
      return { context: (await capture) ?? null, missed: false };
    }
    return awaitScreenContextOutcome(capture);
  };

  // Read at paste time, so a recording that latched hands-free midway counts.
  const recordingProperties = () => ({
    ...deps.getRecordingTraits(),
    recordingDurationMs: deps.recordingDurationMsRef.current,
    awaitReadyMs: deps.releaseTimingRef.current?.awaitReadyMs,
  });

  const recordHistory = (
    text: string,
    history:
      | Pick<DictationEntry, "rawText" | "cleanedText" | "dictationId" | "kind">
      | undefined,
  ) => {
    const userId = useAuth.getState().user?.id;
    if (!userId) return;
    const historyEntry = historyEntryAfterPaste(
      { success: true },
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text,
        date: new Date().toISOString(),
        userId,
        ...history,
      },
    );
    if (historyEntry) saveDictationEntry(historyEntry);
  };

  const pasteDictatedText = async (
    handle: DictationWorkHandle,
    text: string,
    properties: DictationPastedTrackingProperties,
    history?: Pick<
      DictationEntry,
      "rawText" | "cleanedText" | "dictationId" | "kind"
    >,
    screenContext?: DictationScreenContext | null,
    deliverInApp = false,
  ) => {
    if (!workGate.isActive(handle.generation)) return;
    deps.reportPhase("Pasting");
    // In-app fields get text directly; only accepted deliveries record history.
    if (deliverInApp) {
      if (!deliverDictationInApp(text, deps.getPasteEpoch())) return;
      recordHistory(text, history);
      return;
    }
    const pastedApp = resolvePasteTarget(screenContext ?? undefined);
    const pasteStartedAt = Date.now();
    const pasteEpoch = deps.getPasteEpoch();
    const pasteResult = await window.electron!.dictation.paste(
      text,
      pasteEpoch,
    );
    const timing = deps.releaseTimingRef.current;
    if (timing) timing.pasteMs = Date.now() - pasteStartedAt;
    // Stacked MainDesktop copies each run a processor for the same dictation,
    // and the duplicate call is skipped by the main-process guard without
    // pasting. Nothing happened for that copy, so it owns neither the history
    // nor the analytics event — otherwise a skipped duplicate leaves a ghost
    // row and can count words twice when cleanup text diverges.
    if (pasteResult.skipped) return;
    const userId = useAuth.getState().user?.id;
    if (userId) {
      const historyEntry = historyEntryAfterPaste(pasteResult, {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text,
        date: new Date().toISOString(),
        userId,
        ...history,
        ...(pastedApp && { pastedApp }),
      });
      if (historyEntry) saveDictationEntry(historyEntry);
      if (historyEntry && pasteResult.targetUnconfirmed) {
        unmarkPastedWhenMissed(pasteEpoch, historyEntry.id);
      }
    }
    if (!pasteResult.success) {
      notifyDictationError(
        pasteResult.error || "Paste failed for an unknown reason.",
      );
      return;
    }
    // The pill's own toast covers the clipboard fallback; no OS notification.
    tracker.track(TRACKING_EVENTS.DICTATION_PASTED, {
      ...properties,
      // Same names as the dictation service's events, so both sides join on them.
      appVersion: Config.VERSION,
      clientName: Config.APP_NAME,
      osVersion: window.electron?.osVersion,
      totalTimeMs: timing ? getDictationReleaseTotalMs(timing) : undefined,
      pasted: !pasteResult.copiedToClipboard,
      copiedToClipboard: pasteResult.copiedToClipboard === true,
      pasteMs: timing?.pasteMs,
      pasteTarget: pasteTargetFromResult(pasteResult),
      email: useAuth.getState().user?.email,
      // Polishing has no recording of its own to describe.
      ...(history?.kind !== "polish" && recordingProperties()),
    });
  };

  const handleDictateResult = async (
    handle: DictationWorkHandle,
    result: DictationCommitResult,
    deliverInApp: boolean,
  ) => {
    const rawText = result.rawText?.trim() ?? "";
    const timing = deps.releaseTimingRef.current;
    const pastePlan = resolveDictatedPasteText({
      rawText,
      cleanedText: result.cleanedText,
    });
    let textToPaste = pastePlan.text;
    const screenContextStartedAt = Date.now();
    const { context: screenContext, missed: screenContextMissed } =
      await resolveScreenContext(true);
    if (!workGate.isActive(handle.generation)) return;
    if (timing) {
      timing.screenContextMs = Date.now() - screenContextStartedAt;
    }

    let cleanup: DictationCleanupResult | undefined;
    if (pastePlan.needsClientFormat) {
      const cleanupStartedAt = Date.now();
      deps.reportPhase("Polishing");
      cleanup = await cleanupDictationText(rawText, {
        ...(screenContext ? { screenContext } : {}),
        recordingDurationMs: deps.recordingDurationMsRef.current,
        transcriptionTimeMs: timing?.transcribeMs,
        releasedKeyAt: timing
          ? new Date(timing.releaseAt).toISOString()
          : undefined,
        dictationId: deps.dictationIdRef.current,
      });
      textToPaste = cleanup.text;
      if (timing) timing.cleanupMs = Date.now() - cleanupStartedAt;
    }

    await pasteDictatedText(
      handle,
      textToPaste,
      buildDictationPastedProperties({
        originalText: rawText,
        formattedText: textToPaste,
        screenContext,
        hasPostProcessing: true,
        postProcessingTimeMs: timing?.cleanupMs ?? 0,
        transcriptionTimeMs: timing?.transcribeMs,
        dictationId: deps.dictationIdRef.current,
        screenContextMs: timing?.screenContextMs,
        screenContextMissed,
        formatServerMs: cleanup?.serverMs,
        cleanupFallback: cleanup?.fallback,
      }),
      {
        kind: "dictate",
        rawText,
        cleanedText: textToPaste,
        ...(deps.dictationIdRef.current && {
          dictationId: deps.dictationIdRef.current,
        }),
      },
      screenContext,
      deliverInApp,
    );

    if (__DEV__ && workGate.isActive(handle.generation)) {
      const timingLabel = timing
        ? formatDictationReleaseTiming(timing)
        : "release-to-paste —";
      window.electron!.logger.write(
        "info",
        "useDictation",
        formatDictatedLogLine({
          chars: textToPaste.length,
          timingLabel,
        }),
      );
    }
  };

  const handleCommandResult = async (
    handle: DictationWorkHandle,
    command: string,
    deliverInApp: boolean,
    onActivity?: () => void,
  ) => {
    const commandStartedAt = Date.now();
    const screenContext = await deps.getScreenContextCapture();
    if (!workGate.isActive(handle.generation)) return;

    const outcome = await runDetachableActionCommand({
      command,
      screenContext,
      gateSignal: handle.signal,
      reportPhase: deps.reportPhase,
      onActivity,
      onDetached: () => {
        // Free the pill, then stop owning the gate: the run continues under
        // its own controller, and its eventual cleanup must not land on
        // whatever the user has started since.
        finishIfOwner(handle);
        workGate.release(handle.generation);
      },
    });

    // A handed-over run answers in its own orb; nothing here is its business.
    if (outcome.kind === "detached") return;
    if (!workGate.isActive(handle.generation)) return;
    if (outcome.kind === "failed") {
      notifyDictationError(
        `Command failed: ${formatDictationServiceError(outcome.error)}`,
      );
      return;
    }

    const { result } = outcome;
    if (result.executedAction) {
      notifyCommandAction(result.text);
    } else {
      await pasteDictatedText(
        handle,
        result.text,
        buildDictationPastedProperties({
          originalText: command,
          formattedText: result.text,
          screenContext,
          hasPostProcessing: false,
          postProcessingTimeMs: 0,
          transcriptionTimeMs: deps.releaseTimingRef.current?.transcribeMs,
          dictationId: deps.dictationIdRef.current,
        }),
        {
          kind: "command",
          rawText: command,
          cleanedText: result.text,
          ...(deps.dictationIdRef.current && {
            dictationId: deps.dictationIdRef.current,
          }),
        },
        screenContext,
        deliverInApp,
      );
    }
    if (__DEV__ && workGate.isActive(handle.generation)) {
      window.electron!.logger.write(
        "info",
        "useDictation",
        formatCommandResultLogLine({
          executedAction: result.executedAction,
          chars: result.text.length,
          durationMs: Date.now() - commandStartedAt,
        }),
      );
    }
  };

  const processTranscriptionResult = async (
    handle: DictationWorkHandle,
    result: DictationCommitResult,
    deliverInApp: boolean,
    onActivity?: () => void,
  ) => {
    const rawText = result.rawText?.trim() ?? "";
    const cleanedText = result.cleanedText?.trim() ?? "";
    if (!rawText && !cleanedText) return;

    switch (deps.modeRef.current) {
      case "command":
        if (__DEV__) {
          window.electron?.logger.write(
            "info",
            "useDictation",
            formatCommandSttLogLine({
              rawChars: rawText.length,
              cleanedChars: cleanedText.length,
            }),
          );
        }
        await handleCommandResult(
          handle,
          rawText || cleanedText,
          deliverInApp,
          onActivity,
        );
        return;
      case "dictate":
        await handleDictateResult(
          handle,
          {
            rawText: rawText || cleanedText,
            cleanedText: cleanedText || undefined,
            dictationId: result.dictationId,
          },
          deliverInApp,
        );
        return;
      default: {
        const _exhaustive: never = deps.modeRef.current;
        return _exhaustive;
      }
    }
  };

  const runPolishSelection = async (selectedText: string) => {
    const started = workGate.start();
    // Polishing has no recording of its own, so its destination is whoever is
    // listening as it starts rather than any earlier recording's owner.
    const deliverInApp = isDictationInAppCapture();
    deps.modeRef.current = "dictate";
    deps.setState("processing");
    try {
      await withTimeout(
        (async () => {
          const screenContextStartedAt = Date.now();
          const { context: screenContext } = await resolveScreenContext(false);
          if (!workGate.isActive(started.generation)) return;
          const timing = deps.releaseTimingRef.current;
          if (timing) {
            timing.screenContextMs = Date.now() - screenContextStartedAt;
          }
          deps.reportPhase("Polishing");
          const cleanupStartedAt = Date.now();
          const cleanup = await cleanupDictationText(selectedText, {
            ...(screenContext ? { screenContext } : {}),
          });
          const polished = cleanup.text;
          if (!workGate.isActive(started.generation)) return;
          if (timing) timing.cleanupMs = Date.now() - cleanupStartedAt;
          await pasteDictatedText(
            started,
            polished,
            buildDictationPastedProperties({
              originalText: selectedText,
              formattedText: polished,
              screenContext,
              hasPostProcessing: true,
              postProcessingTimeMs: timing?.cleanupMs ?? 0,
              dictationId: undefined,
              formatServerMs: cleanup.serverMs,
              cleanupFallback: cleanup.fallback,
            }),
            {
              kind: "polish",
              rawText: selectedText,
              cleanedText: polished,
            },
            screenContext,
            deliverInApp,
          );
        })(),
        DICTATION_PROCESSING_TIMEOUT_MS,
        "Polish timed out",
        () => workGate.abort(started.generation),
      );
    } catch (error) {
      if (workGate.isOwner(started.generation)) {
        notifyDictationError(
          `Polish failed: ${formatDictationServiceError(error)}`,
        );
      }
    } finally {
      finishIfOwner(started);
    }
  };

  const runProcessing = async (
    transcribe: () => Promise<DictationCommitResult | null>,
    abandon?: () => void,
  ) => {
    const started = workGate.start();
    const deliverInApp = isDictationRecordingInApp();
    deps.setState("processing");
    const isCommand = deps.modeRef.current === "command";

    try {
      const process = async (onActivity?: () => void) => {
        if (
          deps.speechGateRef.current &&
          shouldSkipTranscription(deps.speechGateRef.current)
        ) {
          if (__DEV__) {
            window.electron!.logger.write(
              "info",
              "useDictation",
              "Speech gate skipped transcription — no speech detected",
            );
          }
          abandon?.();
          return;
        }

        deps.reportPhase("Transcribing");
        const transcribeStartedAt = Date.now();
        const result = await transcribe();
        const timing = deps.releaseTimingRef.current;
        if (timing) {
          timing.transcribeMs =
            result?.transcriptionTimeMs ?? Date.now() - transcribeStartedAt;
        }
        onActivity?.();
        if (result?.rawText || result?.cleanedText) {
          await processTranscriptionResult(
            started,
            result,
            deliverInApp,
            onActivity,
          );
        }
      };

      if (isCommand) {
        await withCommandTimeout(process, (reason) =>
          workGate.abort(started.generation, reason),
        );
      } else {
        await withTimeout(
          process(),
          DICTATION_PROCESSING_TIMEOUT_MS,
          "Dictation timed out",
          () => workGate.abort(started.generation),
        );
      }
    } catch (error) {
      if (workGate.isOwner(started.generation)) {
        notifyDictationError(formatDictationServiceError(error));
      }
    } finally {
      finishIfOwner(started);
    }
  };

  const cancelProcessing = () => {
    workGate.invalidate("user-cancel");
    deps.releaseTimingRef.current = null;
    deps.resetRecordingClock();
    deps.speechGateRef.current = null;
    deps.screenContextPromiseRef.current = null;
    deps.setState("idle");
  };

  return { runProcessing, runPolishSelection, cancelProcessing };
}
