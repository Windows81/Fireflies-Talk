export type DictationCue = "start" | "stop" | "cancel" | "hands-free";

export type DictationCueEvent =
  | { type: "start"; handsFree: boolean }
  | { type: "latched" }
  | { type: "stop" }
  | { type: "cancel" };

/** The cue an event should play, or null while sound effects are switched off. */
export function resolveDictationCue(
  event: DictationCueEvent,
  soundEffectsEnabled: boolean,
): DictationCue | null {
  if (!soundEffectsEnabled) return null;
  return cueForDictationEvent(event);
}

export function cueForDictationEvent(event: DictationCueEvent): DictationCue {
  switch (event.type) {
    case "start":
      return event.handsFree ? "hands-free" : "start";
    case "latched":
      return "hands-free";
    case "stop":
      return "stop";
    case "cancel":
      return "cancel";
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}
