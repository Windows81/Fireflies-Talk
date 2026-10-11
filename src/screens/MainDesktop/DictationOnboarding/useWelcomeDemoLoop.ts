import { useEffect, useState } from "react";
import {
  WELCOME_POLISHED_WORD_COUNT,
  WELCOME_SPOKEN_WORDS,
} from "./welcomeDemoCopy";

export type WelcomeDemoPhase = "speaking" | "polishing" | "polished";

export interface WelcomeDemoFrame {
  phase: WelcomeDemoPhase;
  /** How many spoken words have been "heard" so far. */
  spokenCount: number;
}

const WORD_INTERVAL_MS = 130;
/** Extra beat after a word that closes a clause, so it reads as speech. */
const CLAUSE_PAUSE_MS = 180;
/** Longer breath after a word that trails off. */
const TRAIL_OFF_PAUSE_MS = 320;
const AFTER_SPEECH_MS = 700;
/** Each raw word eases in over this long as it is heard. */
export const SPOKEN_WORD_FADE_MS = 240;
const POLISHING_MS = 1100;
const RESTART_PAUSE_MS = 500;

/** The raw words fade out for this long before the polished ones land. */
export const POLISHED_REVEAL_DELAY_MS = 350;
/** Gap between one polished word starting to fade in and the next. */
export const POLISHED_WORD_STAGGER_MS = 45;
export const POLISHED_WORD_FADE_MS = 320;
/** Time to read the finished email once the last word has landed. */
const POLISHED_READ_MS = 3200;

const TOTAL_WORDS = WELCOME_SPOKEN_WORDS.length;

/** How long the polished email takes to finish appearing word by word. */
export const POLISHED_REVEAL_MS =
  POLISHED_REVEAL_DELAY_MS +
  (WELCOME_POLISHED_WORD_COUNT - 1) * POLISHED_WORD_STAGGER_MS +
  POLISHED_WORD_FADE_MS;

const POLISHED_HOLD_MS = POLISHED_REVEAL_MS + POLISHED_READ_MS;

export const WELCOME_DEMO_START: WelcomeDemoFrame = {
  phase: "speaking",
  spokenCount: 0,
};

/** How long the speaker lingers after `word` before the next one. */
export function spokenWordPauseMs(word: string): number {
  if (word.endsWith("...")) return TRAIL_OFF_PAUSE_MS;
  return word.endsWith(",") ? CLAUSE_PAUSE_MS : 0;
}

/** How long `frame` stays on screen before the loop advances. */
export function welcomeDemoFrameDurationMs(frame: WelcomeDemoFrame): number {
  switch (frame.phase) {
    case "speaking":
      if (frame.spokenCount === 0) return RESTART_PAUSE_MS;
      if (frame.spokenCount === TOTAL_WORDS) return AFTER_SPEECH_MS;
      return (
        WORD_INTERVAL_MS +
        spokenWordPauseMs(WELCOME_SPOKEN_WORDS[frame.spokenCount - 1])
      );
    case "polishing":
      return POLISHING_MS;
    case "polished":
      return POLISHED_HOLD_MS;
  }
}

export function nextWelcomeDemoFrame(
  frame: WelcomeDemoFrame,
): WelcomeDemoFrame {
  switch (frame.phase) {
    case "speaking":
      if (frame.spokenCount < TOTAL_WORDS) {
        return { phase: "speaking", spokenCount: frame.spokenCount + 1 };
      }
      return { phase: "polishing", spokenCount: TOTAL_WORDS };
    case "polishing":
      return { phase: "polished", spokenCount: TOTAL_WORDS };
    case "polished":
      return WELCOME_DEMO_START;
  }
}

/** Loops the welcome demo: words arrive live, then the polish lands. */
export function useWelcomeDemoLoop(): WelcomeDemoFrame {
  const [frame, setFrame] = useState<WelcomeDemoFrame>(WELCOME_DEMO_START);

  useEffect(() => {
    const timer = setTimeout(
      () => setFrame(nextWelcomeDemoFrame(frame)),
      welcomeDemoFrameDurationMs(frame),
    );
    return () => clearTimeout(timer);
  }, [frame]);

  return frame;
}
