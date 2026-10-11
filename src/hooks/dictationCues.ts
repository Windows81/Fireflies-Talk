import { Asset } from "expo-asset";
import talkCancel from "@/assets/sounds/talk-cancel.mp3";
import talkHandsFree from "@/assets/sounds/talk-hands-free.mp3";
import talkStart from "@/assets/sounds/talk-start.mp3";
import talkStop from "@/assets/sounds/talk-stop.mp3";
import type { DictationCue } from "./dictationCueEvents";

const CUE_MODULES: Record<DictationCue, number> = {
  start: talkStart,
  stop: talkStop,
  cancel: talkCancel,
  "hands-free": talkHandsFree,
};

const players = new Map<DictationCue, HTMLAudioElement>();

function getPlayer(cue: DictationCue): HTMLAudioElement | null {
  if (typeof Audio === "undefined") return null;
  const existing = players.get(cue);
  if (existing) return existing;

  const player = new Audio(Asset.fromModule(CUE_MODULES[cue]).uri);
  player.preload = "auto";
  players.set(cue, player);
  return player;
}

export function preloadDictationCues(): void {
  (Object.keys(CUE_MODULES) as DictationCue[]).forEach((cue) => {
    getPlayer(cue)?.load();
  });
}

export async function playDictationCue(cue: DictationCue): Promise<void> {
  try {
    const player = getPlayer(cue);
    if (!player) return;
    player.currentTime = 0;
    await player.play();
  } catch {
    // Non-critical UI feedback — ignore failures (e.g. autoplay policy).
  }
}

export const playDictationStartCue = () => playDictationCue("start");
export const playDictationStopCue = () => playDictationCue("stop");
export const playDictationCancelCue = () => playDictationCue("cancel");
export const playDictationHandsFreeCue = () => playDictationCue("hands-free");
