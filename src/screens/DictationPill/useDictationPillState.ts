import type {
  DictationMode,
  DictationPillSide,
  DictationState,
} from "electron/src/types";
import { useEffect, useReducer } from "react";
import { defaultDictationHint } from "./dictationHint";

/**
 * Everything the main process tells the pill about itself. It arrives as one
 * stream of pushes, so it lives as one reducer rather than a scatter of
 * setters — a session update carries both state and mode, and that pairing
 * should land in a single render.
 */
export type DictationPillState = {
  level: number;
  state: DictationState;
  mode: DictationMode;
  isHovered: boolean;
  hint: string;
  side: DictationPillSide;
  isDragging: boolean;
  /** A live meeting is running, with or without its bar on screen. */
  meetingActive: boolean;
  /** Transcript activity within that meeting, driving the meeting meter. */
  meetingTranscribing: boolean;
  /** Rest as the slim nub. False rests as a pill bearing the mark. */
  minimized: boolean;
  /** The "Try Talk" card is up beside the pill, which rests inert under it. */
  teaser: boolean;
};

type Action =
  | { type: "level"; level: number }
  | { type: "session"; state: DictationState; mode: DictationMode }
  | { type: "hover"; isHovered: boolean }
  | { type: "hint"; hint: string }
  | { type: "side"; side: DictationPillSide }
  | { type: "dragging"; isDragging: boolean }
  | { type: "meeting"; meetingActive: boolean }
  | { type: "meetingActivity"; meetingTranscribing: boolean }
  | { type: "minimized"; minimized: boolean }
  | { type: "teaser"; teaser: boolean };

function reduce(
  current: DictationPillState,
  action: Action,
): DictationPillState {
  switch (action.type) {
    case "level":
      return { ...current, level: action.level };
    case "session":
      return { ...current, state: action.state, mode: action.mode };
    case "hover":
      return { ...current, isHovered: action.isHovered };
    case "hint":
      return { ...current, hint: action.hint };
    case "side":
      return { ...current, side: action.side };
    case "dragging":
      return { ...current, isDragging: action.isDragging };
    case "meeting":
      return { ...current, meetingActive: action.meetingActive };
    case "meetingActivity":
      return { ...current, meetingTranscribing: action.meetingTranscribing };
    case "minimized":
      return { ...current, minimized: action.minimized };
    case "teaser":
      return { ...current, teaser: action.teaser };
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

const INITIAL: DictationPillState = {
  level: 0,
  state: "idle",
  mode: "dictate",
  isHovered: false,
  hint: defaultDictationHint(),
  side: "bottom",
  isDragging: false,
  meetingActive: false,
  meetingTranscribing: false,
  minimized: true,
  teaser: false,
};

/** Subscribes to the main process and keeps the pill's view of itself current. */
export function useDictationPillState(): DictationPillState {
  const [pill, dispatch] = useReducer(reduce, INITIAL);

  useEffect(() => {
    const dictation = window.electron?.dictation;
    const cleanups = [
      dictation?.onLevel((level) => dispatch({ type: "level", level })),
      dictation?.onState((state, mode) =>
        dispatch({ type: "session", state, mode }),
      ),
      dictation?.onHover((isHovered) => dispatch({ type: "hover", isHovered })),
      dictation?.onShortcutChanged?.((hint) =>
        dispatch({ type: "hint", hint }),
      ),
      dictation?.onSide((side) => dispatch({ type: "side", side })),
      dictation?.onDragging((isDragging) =>
        dispatch({ type: "dragging", isDragging }),
      ),
      dictation?.onMeetingActive?.((meetingActive) =>
        dispatch({ type: "meeting", meetingActive }),
      ),
      dictation?.onMeetingActivity?.((meetingTranscribing) =>
        dispatch({ type: "meetingActivity", meetingTranscribing }),
      ),
      dictation?.onPillMinimized?.((minimized) =>
        dispatch({ type: "minimized", minimized }),
      ),
      dictation?.onTeaser?.((teaser) => dispatch({ type: "teaser", teaser })),
    ];

    // The pill can mount after these were last pushed, so pull the current
    // values too rather than waiting for the next change.
    void dictation?.getShortcut?.().then((snapshot) => {
      if (snapshot?.hint) dispatch({ type: "hint", hint: snapshot.hint });
    });
    void dictation?.getSide?.().then((side) => {
      if (side) dispatch({ type: "side", side });
    });
    void dictation?.getMeetingActive?.().then((meetingActive) => {
      dispatch({ type: "meeting", meetingActive: !!meetingActive });
    });
    void dictation?.getPillMinimized?.().then((minimized) => {
      dispatch({ type: "minimized", minimized: minimized !== false });
    });
    void dictation?.getTeaser?.().then((teaser) => {
      dispatch({ type: "teaser", teaser: !!teaser });
    });

    return () => cleanups.forEach((cleanup) => cleanup?.());
  }, []);

  return pill;
}
