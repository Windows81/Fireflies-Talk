import type { DesktopConsentPolicy } from "@/features/consent-policy";
import type { ConsentChannel } from "@/features/recording-consent";

export type ConsentChoices = Record<ConsentChannel, boolean>;

/** A required channel reads as ticked whatever the user did to its box. */
export function withRequiredChoices(
  choices: ConsentChoices,
  required: DesktopConsentPolicy,
): ConsentChoices {
  return {
    audio: choices.audio || required.audio,
    camera: choices.camera || required.camera,
    chat: choices.chat || required.chat,
  };
}
