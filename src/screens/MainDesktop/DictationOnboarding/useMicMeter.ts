import type { DictationMicrophoneSelection } from "@/features/settings";
import { recordDictationCapture } from "@/hooks/dictationLastCapture";
import { createResumedAudioContext } from "@/hooks/dictationMicMeter";
import {
  openDictationMicrophone,
  type DictationMicrophoneOption,
} from "@/hooks/dictationMicrophone";
import { useDictationMicrophoneSelection } from "@/hooks/useDictationMicrophoneSelection";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MIC_METER_FFT_SIZE,
  micMeterBars,
  micMeterLevel,
} from "./micMeterLevels";

export type AudioDevice = DictationMicrophoneOption;

export interface MicMeter {
  levels: number[];
  failed: boolean;
  devices: AudioDevice[];
  /** Empty for the system default, matching the stored setting. */
  selectedDeviceId: string;
  /** Name of the mic actually open, which may differ from the request. */
  deviceLabel: string;
  /** True when the chosen mic could not be opened and the default is heard. */
  usingFallback: boolean;
  selectDevice: (device: AudioDevice) => void;
}

/**
 * Opens a microphone and reports live levels for the onboarding meter.
 *
 * The choice is not kept here — it is read from and written straight to the
 * dictation microphone setting, the same one the pill records through, so
 * picking a mic in onboarding is picking the mic for dictation. The meter also
 * opens the device exactly as dictation does, so what it shows is what the
 * pill will hear.
 */
export function useMicMeter(barCount: number): MicMeter {
  const [levels, setLevels] = useState<number[]>(() =>
    new Array(barCount).fill(0),
  );
  const [deviceLabel, setDeviceLabel] = useState("Default");
  const [usingFallback, setUsingFallback] = useState(false);
  const [failed, setFailed] = useState(false);
  const {
    selection,
    devices,
    selectedDeviceId,
    savedMicrophoneMissing,
    selectDevice,
  } = useDictationMicrophoneSelection();

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const cancelledRef = useRef(false);
  // Each request claims a generation. Switching device quickly leaves earlier
  // getUserMedia promises in flight, and one resolving late must close its own
  // tracks rather than replace the stream that superseded it.
  const generationRef = useRef(0);

  const stopAudio = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
  }, []);

  const startAudio = useCallback(
    async (micSelection: DictationMicrophoneSelection) => {
      stopAudio();
      const generation = ++generationRef.current;
      const isStale = () =>
        cancelledRef.current || generationRef.current !== generation;
      setFailed(false);
      try {
        const capture = await openDictationMicrophone(micSelection);
        recordDictationCapture(capture);
        const { stream } = capture;
        if (isStale()) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        setDeviceLabel(capture.active.label || "Default");
        setUsingFallback(capture.usingFallback);

        const ctx = createResumedAudioContext();
        audioCtxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = MIC_METER_FFT_SIZE;
        ctx.createMediaStreamSource(stream).connect(analyser);

        const data = new Uint8Array(analyser.fftSize);
        let level = 0;
        const tick = () => {
          if (isStale()) return;
          analyser.getByteTimeDomainData(data);
          level = micMeterLevel(data, level);
          const bars = micMeterBars(level, barCount);
          setLevels((prev) =>
            prev.every((bar, i) => bar === bars[i]) ? prev : bars,
          );
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        // Denied, unplugged, or in use elsewhere — the step says so rather
        // than leaving an unexplained flat meter.
        if (!isStale()) setFailed(true);
      }
    },
    [barCount, stopAudio],
  );

  // Re-opens whenever the setting changes, so the meter follows the mic even
  // when it was changed from the settings screen rather than this dropdown,
  // and whenever the chosen mic is unplugged or comes back, so the bars keep
  // showing what dictation would hear right now.
  useEffect(() => {
    cancelledRef.current = false;
    void startAudio(selection);
    return () => {
      cancelledRef.current = true;
      stopAudio();
    };
  }, [selection, savedMicrophoneMissing, startAudio, stopAudio]);

  return {
    levels,
    failed,
    devices,
    selectedDeviceId,
    deviceLabel,
    usingFallback,
    selectDevice,
  };
}
