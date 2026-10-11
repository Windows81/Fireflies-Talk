import { useSyncExternalStore } from "react";
import { TALK_DEMO_EMAIL, TALK_DEMO_MESSAGES } from "./talkIntroDemoCopy";

export type TalkDemoScene = "messages" | "email";

export type TalkDemoStep =
  | { kind: "reveal"; pauseMs: number }
  | { kind: "listen"; words: readonly string[] }
  | { kind: "hold"; ms: number }
  | { kind: "dissolve"; ms: number };

export interface TalkDemoFrame {
  scene: TalkDemoScene;
  step: number;
  /** How many spoken words have been "heard" in the current listen step. */
  spokenCount: number;
}

/** Speech has a cadence: short words tumble out, long ones take a beat. */
const WORD_BASE_MS = 70;
const WORD_PER_CHAR_MS = 16;
const AFTER_SPEECH_MS = 700;
const AFTER_BUBBLE_MS = 900;
const AFTER_REPLY_MS = 1400;
const FINAL_HOLD_MS = 5_000;

/** A scene fades out for this long, then the next one fades in for as long. */
export const SCENE_FADE_MS = 400;

export const TALK_DEMO_SCRIPTS = {
  messages: [
    { kind: "reveal", pauseMs: AFTER_BUBBLE_MS },
    { kind: "listen", words: TALK_DEMO_MESSAGES.spoken1 },
    { kind: "reveal", pauseMs: AFTER_REPLY_MS },
    { kind: "reveal", pauseMs: AFTER_BUBBLE_MS },
    { kind: "listen", words: TALK_DEMO_MESSAGES.spoken2 },
    { kind: "reveal", pauseMs: 0 },
    { kind: "hold", ms: FINAL_HOLD_MS },
    { kind: "dissolve", ms: SCENE_FADE_MS },
  ],
  email: [
    { kind: "reveal", pauseMs: AFTER_BUBBLE_MS },
    { kind: "listen", words: TALK_DEMO_EMAIL.spoken },
    { kind: "reveal", pauseMs: 0 },
    { kind: "hold", ms: FINAL_HOLD_MS },
    { kind: "dissolve", ms: SCENE_FADE_MS },
  ],
} satisfies Record<TalkDemoScene, readonly TalkDemoStep[]>;

const NEXT_SCENE = {
  messages: "email",
  email: "messages",
} satisfies Record<TalkDemoScene, TalkDemoScene>;

export const TALK_DEMO_START: TalkDemoFrame = {
  scene: "messages",
  step: 0,
  spokenCount: 0,
};

export function talkDemoStep(frame: TalkDemoFrame): TalkDemoStep {
  return TALK_DEMO_SCRIPTS[frame.scene][frame.step];
}

/** How many items (bubbles, header, reply) of the scene are on screen. */
export function talkDemoRevealedCount(frame: TalkDemoFrame): number {
  return TALK_DEMO_SCRIPTS[frame.scene]
    .slice(0, frame.step + 1)
    .filter((step) => step.kind === "reveal").length;
}

/**
 * The line the person is (or was just) saying: the current listen step's
 * words, or the previous one's so the line can fade out in place.
 */
export function talkDemoSpokenWords(frame: TalkDemoFrame): readonly string[] {
  const steps = TALK_DEMO_SCRIPTS[frame.scene].slice(0, frame.step + 1);
  const listen = steps.reverse().find((step) => step.kind === "listen");
  return listen?.kind === "listen" ? listen.words : [];
}

/** How many of `talkDemoSpokenWords` have been heard. */
export function talkDemoHeardCount(frame: TalkDemoFrame): number {
  const step = talkDemoStep(frame);
  if (step.kind === "listen") return frame.spokenCount;
  return talkDemoSpokenWords(frame).length;
}

/** The words heard so far, or "" when the pill is not listening. */
export function talkDemoSpokenText(frame: TalkDemoFrame): string {
  const step = talkDemoStep(frame);
  if (step.kind !== "listen") return "";
  return step.words.slice(0, frame.spokenCount).join(" ");
}

export function talkDemoWordIntervalMs(word: string): number {
  return WORD_BASE_MS + word.length * WORD_PER_CHAR_MS;
}

/** How long `frame` stays on screen before the loop advances. */
export function talkDemoFrameDurationMs(frame: TalkDemoFrame): number {
  const step = talkDemoStep(frame);

  switch (step.kind) {
    case "reveal":
      return step.pauseMs;
    case "listen":
      return frame.spokenCount < step.words.length
        ? talkDemoWordIntervalMs(step.words[frame.spokenCount])
        : AFTER_SPEECH_MS;
    case "hold":
      return step.ms;
    case "dissolve":
      return step.ms;
  }
}

export function nextTalkDemoFrame(frame: TalkDemoFrame): TalkDemoFrame {
  const step = talkDemoStep(frame);

  if (step.kind === "listen" && frame.spokenCount < step.words.length) {
    return { ...frame, spokenCount: frame.spokenCount + 1 };
  }

  if (step.kind === "dissolve") {
    return { scene: NEXT_SCENE[frame.scene], step: 0, spokenCount: 0 };
  }

  return { scene: frame.scene, step: frame.step + 1, spokenCount: 0 };
}

/**
 * Advances the demo on its own timer while anyone is watching, starting from
 * the first frame each time the first watcher arrives.
 */
class TalkDemoClock {
  private frame = TALK_DEMO_START;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private readonly listeners = new Set<() => void>();

  subscribe = (listener: () => void): (() => void) => {
    if (this.listeners.size === 0) this.start();
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) clearTimeout(this.timer);
    };
  };

  getSnapshot = (): TalkDemoFrame => this.frame;

  private start() {
    this.frame = TALK_DEMO_START;
    this.schedule();
  }

  private schedule() {
    this.timer = setTimeout(() => {
      this.frame = nextTalkDemoFrame(this.frame);
      this.listeners.forEach((listener) => listener());
      this.schedule();
    }, talkDemoFrameDurationMs(this.frame));
  }
}

const clock = new TalkDemoClock();

/**
 * Loops the banner demo: a question lands, the pill listens while the words
 * arrive, the typed reply lands, the finished scene holds, then dissolves into
 * the other scene.
 */
export function useTalkIntroDemoLoop(): TalkDemoFrame {
  return useSyncExternalStore(
    clock.subscribe,
    clock.getSnapshot,
    () => TALK_DEMO_START,
  );
}
