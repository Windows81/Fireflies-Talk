import {
  formatWordCount,
  getMinutesSaved,
  getTimeSaved,
  type TimeSaved,
} from "@/hooks/dictationStats";
import { createStyles } from "@/styles";
import {
  MILESTONE_CARD_HEIGHT,
  MILESTONE_CARD_WIDTH,
  paintMilestoneCard,
} from "@/utils/milestoneCardPainter";
import { useEffect, useRef, type FC } from "react";
import { View } from "react-native";

/** Long enough to watch the figures climb from low numbers, not just tick up. */
const COUNT_UP_MS = 2_600;
/** One turn of the waveform, which keeps running after the count-up settles. */
const WAVEFORM_PERIOD_MS = 1_400;
/**
 * Once the figures have settled only the waveform moves, and a card left open
 * while someone writes their post should not repaint 1200x630 at the display's
 * full rate for it. Fast enough that the wave still reads as continuous.
 */
const WAVEFORM_FRAME_MS = 1_000 / 20;

/** Fast out of the gate, easing into the final figure. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * The time saved partway through the climb, always in the unit the card
 * settles on: letting it start in minutes and turn into hours would relabel
 * the column mid-count.
 */
const savedAt = (total: number, progress: number, final: TimeSaved) => {
  // getTimeSaved rounds minutes before it rounds hours; interpolating from raw
  // minutes can land a step below it, so the finished preview takes its figure
  // rather than computing one that the shared card would not agree with.
  if (progress >= 1) return final;

  const minutes = getMinutesSaved(total) * progress;
  const value = final.unit.startsWith("hour") ? minutes / 60 : minutes;
  return { amount: formatWordCount(Math.round(value)), unit: final.unit };
};

export interface MilestoneCardCanvasProps {
  totalWords: number;
  milestone: string;
  link: string;
}

/**
 * The card as a live canvas: the figures counting up once, then holding, over
 * a waveform that keeps moving while the dialog is open. Painted straight onto
 * the canvas — encoding a PNG per frame, as an <Image> would need, costs three
 * quarters of a megapixel a tick for a flourish nobody shares.
 */
export const MilestoneCardCanvas: FC<MilestoneCardCanvasProps> = ({
  totalWords,
  milestone,
  link,
}) => {
  const host = useRef<View>(null);

  useEffect(() => {
    // react-native-web hands back the host element itself.
    const node = host.current as unknown as HTMLElement | null;
    if (!node) return;

    const canvas = document.createElement("canvas");
    canvas.width = MILESTONE_CARD_WIDTH;
    canvas.height = MILESTONE_CARD_HEIGHT;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    node.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return () => canvas.remove();

    const finalSaved = getTimeSaved(totalWords);
    // Every frame is laid out against the figures it ends on, so nothing moves.
    const layout = {
      totalWords: formatWordCount(totalWords),
      timeSaved: finalSaved,
    };

    const paint = (words: number, saved: TimeSaved, phase?: number) =>
      paintMilestoneCard(
        ctx,
        {
          totalWords: formatWordCount(words),
          milestone,
          timeSaved: saved,
          link,
          layout,
        },
        phase,
      );

    // Motion is a flourish here; anyone who has asked for less gets the card.
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    )?.matches;
    if (reduced) {
      paint(totalWords, finalSaved);
      return () => canvas.remove();
    }

    let raf = 0;
    let start = performance.now();
    let elapsedBeforeHidden = 0;

    let lastPaint = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const elapsed = elapsedBeforeHidden + (now - start);
      // The count-up gets every frame; the waveform after it does not.
      const settled = elapsed > COUNT_UP_MS;
      if (settled && now - lastPaint < WAVEFORM_FRAME_MS) return;
      lastPaint = now;

      const eased = easeOut(Math.min(1, elapsed / COUNT_UP_MS));
      paint(
        Math.round(totalWords * eased),
        savedAt(totalWords, eased, finalSaved),
        elapsed / WAVEFORM_PERIOD_MS,
      );
    };
    // A hidden window still services requestAnimationFrame in Electron, and
    // repainting the card for nobody is pure cost.
    const onVisibility = () => {
      if (document.hidden) {
        elapsedBeforeHidden += performance.now() - start;
        cancelAnimationFrame(raf);
        return;
      }
      start = performance.now();
      raf = requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", onVisibility);

    raf = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(raf);
      canvas.remove();
    };
  }, [link, milestone, totalWords]);

  return <View ref={host} style={styles.host} />;
};

const styles = createStyles({
  host: {
    width: "100%",
    aspectRatio: MILESTONE_CARD_WIDTH / MILESTONE_CARD_HEIGHT,
  },
});
