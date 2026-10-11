import { IconFileText, IconMic } from "@/assets/svg";
import { PillWaveform } from "@/screens/Live/components/PillWaveform";
import type { Theme } from "@/styles";
import type { DictationPillSide, DictationState } from "electron/src/types";
import type { FC } from "react";
import { Pressable, View } from "react-native";
import { EMBER_DOUSE_MS } from "./dictationPillEmberGeometry";
import { DictationPillFirefly } from "./DictationPillFirefly";
import {
  PillActionButton,
  PillDivider,
  PillLayer,
} from "./DictationPillChrome";
import {
  isDictationPillVertical,
  type DictationPillMode,
} from "./dictationPillMode";
import { SETTLE_SPARKS_FADE_MS } from "./dictationPillSettle";
import {
  meterColor,
  sliverEdgeBias,
  styles,
  webkitNoDrag,
} from "./dictationPillStyles";
import type { PillLayerLeave } from "./useDictationPillMorph";

/**
 * A landed session's sparks breathe out where they are: a fade alone. Blurring
 * them turned four sparks into soft blobs right where the embers surface, and
 * blobs over dots read as shaking.
 */
const SETTLE_BREATHE: PillLayerLeave = {
  ms: SETTLE_SPARKS_FADE_MS,
  scale: 1,
  blurPx: 0,
};

/** Which half of the launcher the pointer is over, for the hover tooltip. */
export type DictationPillAction = "dictate" | "notes" | "session";

type Props = {
  side: DictationPillSide;
  mode: DictationPillMode;
  state: DictationState;
  theme: Theme;
  level: number;
  /** A meeting is running: the notes half becomes a way back to the live bar. */
  meetingActive: boolean;
  /** Fn+Shift: the pill wears the purple gradient, which the meter must survive. */
  isAction: boolean;
  /** A session is coming home: its meter breathes out rather than swapping off. */
  settling: boolean;
  onHoverAction: (action: DictationPillAction | null) => void;
};

function startDictation() {
  window.electron?.dictation.requestStart();
}

function startNotes() {
  window.electron?.dictation.requestStartNotes();
}

function stopDictation() {
  window.electron?.dictation.requestStop();
}

function showLiveBar() {
  window.electron?.dictation.showLiveBar?.();
}

export const DictationPillLayers: FC<Props> = ({
  side,
  mode,
  state,
  theme,
  level,
  meetingActive,
  isAction,
  settling,
  onHoverAction,
}) => {
  const vertical = isDictationPillVertical(side);
  const meterLeave = settling ? SETTLE_BREATHE : undefined;

  // The resting shape has no layer of its own: it is the mark alone, and the
  // mark rides above these layers so it can slide between shapes.
  return (
    <>
      <PillLayer active={mode === "hidden"} vertical={vertical}>
        <View style={[styles.layer, sliverEdgeBias(side)]} />
      </PillLayer>

      {/* The buttons wait for the embers to go out first; see EMBER_DOUSE_MS. */}
      <PillLayer
        active={mode === "open"}
        vertical={vertical}
        enterDelayMs={EMBER_DOUSE_MS}
      >
        <PillActionButton
          edge="leading"
          vertical={vertical}
          accessibilityLabel="Start dictation"
          onPress={startDictation}
          onHoverChange={(hovered) => onHoverAction(hovered ? "dictate" : null)}
          Icon={IconMic}
        />
        <PillDivider vertical={vertical} />
        <PillActionButton
          edge="trailing"
          vertical={vertical}
          accessibilityLabel={
            meetingActive ? "Show meeting controls" : "Take new notes"
          }
          onPress={meetingActive ? showLiveBar : startNotes}
          onHoverChange={(hovered) => onHoverAction(hovered ? "notes" : null)}
          Icon={IconFileText}
        />
      </PillLayer>

      <PillLayer
        active={mode === "dictating"}
        vertical={vertical}
        leave={meterLeave}
      >
        <Pressable
          testID="no-drag"
          accessibilityRole="button"
          accessibilityLabel="Finish dictation and paste"
          onPress={stopDictation}
          onHoverIn={() => onHoverAction("session")}
          onHoverOut={() => onHoverAction(null)}
          style={[styles.layer, webkitNoDrag]}
        >
          {/* Settling, the layer is fading out: keep the sparks it was showing
              rather than swapping in the bars for the last frames. */}
          <PillMeter
            theme={theme}
            level={level}
            vertical={vertical}
            processing={state === "processing" || settling}
            isAction={isAction}
          />
        </Pressable>
      </PillLayer>
    </>
  );
};

/**
 * The dictation meter: the mark beside a waveform driven by the mic.
 *
 * Transcription runs on after the mic closes, so the bars give way to the
 * firefly while it does — the mark stays put through the swap.
 *
 * The mark itself is drawn by DictationPillMark over this layer; the slot here
 * only holds its place in the row.
 */
const PillMeter: FC<{
  theme: Theme;
  level: number;
  vertical: boolean;
  processing?: boolean;
  isAction?: boolean;
}> = ({ theme, level, vertical, processing, isAction }) => (
  <View
    style={[styles.meterLayer, vertical && styles.meterLayerVertical]}
    pointerEvents="none"
  >
    <View style={styles.markSlot} />
    <View style={[styles.meter, vertical && styles.meterVertical]}>
      {processing ? (
        <DictationPillFirefly
          theme={theme}
          vertical={vertical}
          isAction={isAction}
        />
      ) : (
        <View style={vertical && styles.waveformSpin}>
          <PillWaveform color={meterColor} level={level} />
        </View>
      )}
    </View>
  </View>
);
