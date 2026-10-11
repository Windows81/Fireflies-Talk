import {
  dictationAutoStopChipLabel,
  isDictationAutoStopUrgent,
} from "@/hooks/dictationAutoStop";
import { useLocalSettings } from "@/features/settings";
import { dictationHotkeyLabel, notesShortcutLabel } from "./dictationHint";
import { shouldShowCommandChrome } from "electron/src/dictation/dictation-mode";
import {
  dictationPillToastInset,
  getDictationPillToastAnchor,
} from "electron/src/dictation/dictation-pill-toast-layout";
import type { DictationPillSide } from "electron/src/types";
import { useTheme } from "@/styles";
import { isWindowsDesktop } from "@/utils/device";
import { useEffect, useRef, useState, type FC } from "react";
import { Animated, View } from "react-native";
import { PillActionSkin, PillToast, PillTooltip } from "./DictationPillChrome";
import { PillShellSurface } from "./DictationPillShellSurface";
import { pasteFallbackToastCopy } from "./dictationPasteFallbackToast";
import { usePasteFallbackToast } from "./usePasteFallbackToast";
import { DictationPillEmbers } from "./DictationPillEmbers";
import {
  PillLanternGlow,
  PillNearHalo,
  type LitHalf,
} from "./DictationPillGlow";
import {
  DictationPillLayers,
  type DictationPillAction,
} from "./DictationPillLayers";
import { DictationPillMark } from "./DictationPillMark";
import {
  dictationPillMorph,
  isDictationPillVertical,
  MEETING_MIC_PAUSED_LABEL,
  resolveDictationPillMode,
  showsMeetingMicPaused,
} from "./dictationPillMode";
import {
  SHELL_BORDER_ACTION,
  SHELL_BORDER_REST,
  styles,
} from "./dictationPillStyles";
import { useDictationAutoStopRemaining } from "./useDictationAutoStopRemaining";
import { useDictationPillBackdrop } from "./useDictationPillBackdrop";
import { useDictationPillHover } from "./useDictationPillHover";
import { useDictationPillSettle } from "./useDictationPillSettle";
import { useDictationPillMorph } from "./useDictationPillMorph";
import { useDictationPillState } from "./useDictationPillState";
import { useDictationPillStir } from "./useDictationPillStir";
import { useFloatingWindowDrag } from "@/hooks/useFloatingWindowDrag";

const DICTATION_PILL_DRAG = {
  onStart: () => window.electron?.dictation.startManualDrag(),
  onEnd: () => window.electron?.dictation.endManualDrag(),
};

/**
 * Idle, at rest with nothing to show, the pill softens over a light backdrop:
 * a touch of what is behind it shows through rather than sitting as a flat
 * dark shape on a bright screen. Over a dark backdrop it darkens instead —
 * see PillShellSurface — since there the shell already reads as part of the
 * background and a lower opacity would only look faded, not settled.
 */
const IDLE_LIGHT_OPACITY = 0.82;

const TOAST_PLATFORM = isWindowsDesktop() ? "win32" : "darwin";
const TOAST_COPY = pasteFallbackToastCopy(isWindowsDesktop());

/**
 * The universal pill. One shell that rests as a sliver, opens into a
 * dictate/notes launcher on hover, and stretches into a live meter while a
 * session runs. Action-mode sessions swap the neutral glass for a
 * purple-to-pink gradient.
 *
 * Four embers ride along: muted in the sliver, hidden in the mark's cells, and
 * gone while the launcher is open, where a divider marks the middle and a
 * lantern lights whichever half the cursor is over from within. A finished
 * session settles home in one soft motion.
 */
export const DictationPillScreen: FC = () => {
  const theme = useTheme();
  const {
    level,
    state,
    mode,
    isHovered,
    hint,
    side,
    isDragging,
    meetingActive,
    minimized,
    teaser,
  } = useDictationPillState();
  const [hoveredAction, setHoveredAction] =
    useState<DictationPillAction | null>(null);
  // Shared localStorage, so the pill's own window sees whatever the settings
  // screen last wrote without a channel of its own.
  const { quickNoteShortcutEnabled, quickNoteShortcutKey } = useLocalSettings();

  const session = { state, isHovered, isDragging, minimized };
  // Whether a session just landed is read off the mode the pill would take on
  // its own; while it settles, that mode is held at rest.
  const settling = useDictationPillSettle(
    resolveDictationPillMode(session),
    state,
  );
  // A click that finished the session leaves the cursor on the pill; that
  // hover must not open the launcher the moment the ending is over. Under the
  // "Try Talk" card the pill is a plain sliver: hovering it opens nothing,
  // and there is no launcher to click. The hotkey still works as ever.
  const hovered = useDictationPillHover(isHovered && !teaser, settling);
  const pillMode = resolveDictationPillMode({
    ...session,
    isHovered: hovered,
    settling,
  });
  const vertical = isDictationPillVertical(side);
  const isAction = shouldShowCommandChrome(mode, state);
  // At rest, minimized or not — not the launcher, a session, or settling. A
  // settling pill already resolves to a resting mode, and dimming or darkening
  // its still-fading meter would cut the ending short.
  const isIdleShell =
    !settling && (pillMode === "hidden" || pillMode === "resting");
  const backdrop = useDictationPillBackdrop();
  const idleLightOpacity =
    isIdleShell && backdrop === "light" ? IDLE_LIGHT_OPACITY : undefined;
  const morph = dictationPillMorph(pillMode, settling);
  const shell = useDictationPillMorph(pillMode, vertical, morph);
  const stir = useDictationPillStir(side);

  const autoStopRemaining = useDictationAutoStopRemaining(
    state === "recording",
  );
  const tooltip = resolveTooltip({
    pillMode,
    hoveredAction,
    hint,
    autoStopRemaining,
    meetingActive,
    meetingMicPaused: showsMeetingMicPaused({
      mode: pillMode,
      state,
      meetingActive,
    }),
    notesKeys: quickNoteShortcutEnabled
      ? notesShortcutLabel(quickNoteShortcutKey)
      : null,
  });

  // The pill's cursor leaves the launcher before the collapse finishes, so a
  // stale hover would keep a tooltip on screen over the resting sliver.
  useEffect(() => {
    if (pillMode !== "open") setHoveredAction(null);
  }, [pillMode]);

  const rootRef = useRef<View>(null);
  useFloatingWindowDrag(rootRef, DICTATION_PILL_DRAG, !teaser);
  const toastVisible = usePasteFallbackToast();

  return (
    <View ref={rootRef} style={[styles.container, containerStyle(side)]}>
      <PillNearHalo
        visible={pillMode === "hidden" && !teaser}
        warm={settling}
        side={side}
        stir={stir}
        theme={theme}
      />
      <Animated.View
        pointerEvents={teaser ? "none" : "auto"}
        style={[
          styles.shell(theme),
          isAction && styles.shellActionGlow,
          {
            width: shell.width,
            height: shell.height,
            borderRadius: shell.borderRadius,
            borderColor: isAction ? SHELL_BORDER_ACTION : SHELL_BORDER_REST,
            opacity: idleLightOpacity,
          },
        ]}
      >
        <PillShellSurface
          theme={theme}
          idle={isIdleShell}
          backdrop={backdrop}
        />
        <PillActionSkin active={isAction} />
        <Animated.View
          pointerEvents="none"
          style={[styles.shellBevel, { borderRadius: shell.borderRadius }]}
        />
        <PillLanternGlow
          active={pillMode === "open"}
          half={litHalf(hoveredAction)}
          vertical={vertical}
          theme={theme}
        />
        <DictationPillLayers
          side={side}
          mode={pillMode}
          state={state}
          theme={theme}
          level={level}
          meetingActive={meetingActive}
          isAction={isAction}
          settling={settling}
          onHoverAction={setHoveredAction}
        />
        <DictationPillMark
          mode={pillMode}
          vertical={vertical}
          isAction={isAction}
          morph={morph}
          settling={settling}
        />
      </Animated.View>
      {/* Outside the shell: hung from the fixed docked edge, not from a
          centre that moves in layout steps as the shell changes size. */}
      <DictationPillEmbers
        mode={pillMode}
        side={side}
        theme={theme}
        stir={stir}
        morph={morph}
        settling={settling}
        backdrop={backdrop}
      />
      {tooltip ? (
        <View
          style={[styles.tooltipLayer, tooltipLayerStyle(side)]}
          pointerEvents="none"
        >
          <PillTooltip
            theme={theme}
            label={tooltip.label}
            keys={tooltip.keys}
            after={tooltip.after}
            urgent={tooltip.urgent}
          />
        </View>
      ) : null}
      {toastVisible ? (
        <Animated.View
          style={[styles.toastLayer, toastLayerStyle(side, shell)]}
          pointerEvents="none"
        >
          <PillToast
            theme={theme}
            label={TOAST_COPY.label}
            keys={TOAST_COPY.keys}
          />
        </Animated.View>
      ) : null}
    </View>
  );
};

function containerStyle(side: DictationPillSide) {
  switch (side) {
    case "left":
      return styles.containerLeft;
    case "right":
      return styles.containerRight;
    case "bottom":
      return styles.containerBottom;
    case "top":
      return styles.containerTop;
    default: {
      const _exhaustive: never = side;
      return _exhaustive;
    }
  }
}

/** The lantern lights the launcher half under the cursor; a session has none. */
function litHalf(action: DictationPillAction | null): LitHalf {
  switch (action) {
    case "dictate":
      return "leading";
    case "notes":
      return "trailing";
    case "session":
    case null:
      return null;
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

/**
 * Pins the toast just past the pill, whatever shape the shell is in or
 * morphing to — see dictation-pill-toast-layout.
 */
function toastLayerStyle(
  side: DictationPillSide,
  shell: { width: Animated.Value; height: Animated.Value },
) {
  const thickness = isDictationPillVertical(side) ? shell.width : shell.height;
  const depth = Animated.add(
    thickness,
    dictationPillToastInset(side, TOAST_PLATFORM),
  );
  const anchor = getDictationPillToastAnchor(side);
  switch (side) {
    case "bottom":
      return { ...anchor, paddingBottom: depth };
    case "top":
      return { ...anchor, paddingTop: depth };
    case "left":
      return { ...anchor, paddingLeft: depth };
    case "right":
      return { ...anchor, paddingRight: depth };
    default: {
      const _exhaustive: never = side;
      return _exhaustive;
    }
  }
}

function tooltipLayerStyle(side: DictationPillSide) {
  switch (side) {
    case "left":
      return styles.tooltipLayerLeft;
    case "right":
      return styles.tooltipLayerRight;
    case "bottom":
      return styles.tooltipLayerBottom;
    case "top":
      return styles.tooltipLayerTop;
    default: {
      const _exhaustive: never = side;
      return _exhaustive;
    }
  }
}

/** A running auto-stop countdown outranks any hover label. */
function resolveTooltip(params: {
  pillMode: ReturnType<typeof resolveDictationPillMode>;
  hoveredAction: DictationPillAction | null;
  hint: string;
  autoStopRemaining: number | null;
  /** A meeting is running: the notes half opens the live bar instead. */
  meetingActive: boolean;
  /** This dictation is holding a running meeting's mic. */
  meetingMicPaused: boolean;
  /** Null when the quick-note shortcut is switched off. */
  notesKeys: string | null;
}): {
  label: string;
  keys?: string;
  after?: string;
  urgent?: boolean;
} | null {
  const {
    pillMode,
    hoveredAction,
    hint,
    autoStopRemaining,
    meetingActive,
    meetingMicPaused,
    notesKeys,
  } = params;

  if (autoStopRemaining != null) {
    const label = dictationAutoStopChipLabel(autoStopRemaining);
    if (label) {
      return { label, urgent: isDictationAutoStopUrgent(autoStopRemaining) };
    }
  }
  if (pillMode === "dictating") {
    if (hoveredAction === "session") return { label: "Finish and paste" };
    return meetingMicPaused ? { label: MEETING_MIC_PAUSED_LABEL } : null;
  }
  // Only the launcher labels its halves. A hover recorded there outlives the
  // mode by a frame — the effect that clears it runs after this render — so a
  // session starting under the cursor would otherwise flash "to dictate" on a
  // pill that no longer offers it.
  if (pillMode !== "open") return null;
  if (hoveredAction === "dictate") {
    return {
      label: "Press",
      keys: dictationHotkeyLabel(hint),
      after: "to dictate",
    };
  }
  if (hoveredAction === "notes") {
    if (meetingActive) return { label: "Show meeting controls" };
    // With the shortcut off there are no keys to promise, so name the action.
    return notesKeys
      ? { label: "Press", keys: notesKeys, after: "to take notes" }
      : { label: "Take new notes" };
  }
  return null;
}
