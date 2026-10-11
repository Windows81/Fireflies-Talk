import { Logger } from "@/logger";

const log = new Logger("AudioConsent");

/**
 * What `electron/assets/consent-message.mp3` says, transcribed, so a record of
 * the announcement can state what participants heard rather than only that
 * something played. Deliberately identical to the meeting-chat wording on the
 * server, so one meeting's records do not appear to say two different things.
 *
 * Must be updated together with the asset.
 */
export const CONSENT_AUDIO_TRANSCRIPT =
  "This meeting is being transcribed by Fireflies.ai";

/**
 * Plays the spoken consent message, reporting whether it actually played.
 * Callers that record the announcement need the difference: a missing asset
 * resolves without an error, and must not be filed as an announcement.
 */
export async function playConsentAudio(): Promise<boolean> {
  const data = await window.electron?.audio?.getConsentMessageData();
  if (!data) {
    log.warn("Consent audio file not found");
    return false;
  }
  const bytes = new Uint8Array(data);
  const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
  const audio = new Audio(url);
  audio.volume = 1.0;
  try {
    await audio.play();
    log.info("Audio consent message playing");
    await new Promise<void>((resolve, reject) => {
      audio.addEventListener("ended", () => resolve(), { once: true });
      audio.addEventListener("abort", () => resolve(), { once: true });
      audio.addEventListener(
        "error",
        () => reject(new Error("Consent audio playback failed")),
        { once: true },
      );
    });
    log.info("Audio consent message finished");
    return true;
  } finally {
    URL.revokeObjectURL(url);
  }
}
