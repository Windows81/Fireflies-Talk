import { isDesktop, isMainDesktopWindow } from "@/utils/device";
import { useDictationTranscriptionProvider } from "@/features/settings";
import {
  DEFAULT_DICTATION_TRANSCRIPTION_PROVIDER,
  type DictationTranscriptionProvider,
} from "@/features/settings/dictationTranscriptionProvider";
import { shouldBindDictationRuntime } from "./dictationRuntimeHost";
import { dictationRuntimeLock } from "./dictationRuntimeLock";
import { startDictationRuntime } from "./dictationRuntime";
import { useIsScreenContextDisabledByAdmin } from "./useIsScreenContextDisabledByAdmin";
import { useEffect } from "react";

let transcriptionProvider: DictationTranscriptionProvider =
  DEFAULT_DICTATION_TRANSCRIPTION_PROVIDER;
let screenContextDisabled = false;

export function useDictation() {
  const { value } = useDictationTranscriptionProvider();
  transcriptionProvider = value;
  screenContextDisabled = useIsScreenContextDisabledByAdmin();

  useEffect(() => {
    if (
      !shouldBindDictationRuntime({
        isDesktop,
        hasDictationApi: Boolean(window.electron?.dictation),
        isMainWindow: isMainDesktopWindow(),
      })
    ) {
      if (isDesktop && isMainDesktopWindow()) {
        console.error(
          "[useDictation] window.electron.dictation is not available",
        );
      }
      return;
    }

    return dictationRuntimeLock.acquire(() =>
      startDictationRuntime({
        getTranscriptionProvider: () => transcriptionProvider,
        isScreenContextDisabled: () => screenContextDisabled,
      }),
    );
  }, []);
}
