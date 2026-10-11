import { useTheme } from "@/styles";
import { useCallback, useEffect, useRef, useState, type FC } from "react";
import { useWindowDimensions, View } from "react-native";
import { actionJobCopyText, type ActionJob } from "./dictationActionJob";
import {
  ACTION_ORB_GAP,
  ACTION_ORB_MARGIN,
  ACTION_ORB_SIZE,
  orbStyles,
} from "./dictationActionOrbStyles";
import {
  ACTION_ORB_PANEL_WIDTH,
  panelStyles,
} from "./dictationActionPanelStyles";
import { DictationActionOrb, type OrbFlight } from "./DictationActionOrb";
import { DictationActionProgressPanel } from "./DictationActionProgressPanel";
import { useActionOrbClusterDrag } from "./useActionOrbClusterDrag";
import { useActionRuns } from "./useActionRuns";

/**
 * The orb and its panel are separated by a transparent gap, and transparent
 * means click-through — the pointer crossing it leaves the window entirely, so
 * the DOM reports a leave with nothing to enter. This is how long the panel
 * survives that crossing. It has to outlast the click-through poll that turns
 * the window interactive again when the pointer lands on the panel.
 */
const HOVER_GRACE_MS = 450;

/**
 * The detached-action overlay. It spans the work area — an orb flies out of the
 * pill at the bottom of the screen and parks in the top-right corner, which no
 * window smaller than the screen could show — and is otherwise empty air that
 * passes every click through to whatever is underneath.
 */
export const DictationActionOrbsOverlay: FC = () => {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const { jobs, dismiss } = useActionRuns();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { dragRef, offset } = useActionOrbClusterDrag();

  const holdHover = useCallback((id: string) => {
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    releaseTimer.current = null;
    setHoveredId(id);
  }, []);

  const releaseHover = useCallback(() => {
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    releaseTimer.current = setTimeout(() => {
      releaseTimer.current = null;
      setHoveredId(null);
    }, HOVER_GRACE_MS);
  }, []);

  useEffect(
    () => () => {
      if (releaseTimer.current) clearTimeout(releaseTimer.current);
    },
    [],
  );

  // A job that ends or is dismissed must not leave its panel pinned open over
  // nothing.
  useEffect(() => {
    if (hoveredId && !jobs.some((job) => job.id === hoveredId)) {
      setHoveredId(null);
    }
  }, [jobs, hoveredId]);

  const copy = useCallback((job: ActionJob) => {
    const text = actionJobCopyText(job);
    if (!text) return;
    void window.electron?.clipboard?.writeText(text);
  }, []);

  const openLink = useCallback((url: string) => {
    void window.electron?.dictation.openActionLink?.(url);
  }, []);

  // The overlay never takes focus, so whatever the user was typing in is still
  // frontmost and the paste lands there — when it does. The button waits on the
  // answer rather than confirming a paste that never arrived.
  const paste = useCallback(async (job: ActionJob) => {
    const text = actionJobCopyText(job);
    if (!text) return false;
    const outcome = await window.electron?.dictation.pasteActionResult?.(text);
    return outcome?.success === true && !outcome.copiedToClipboard;
  }, []);

  const hoveredJob = jobs.find((job) => job.id === hoveredId) ?? null;
  // One flick must not put the orbs somewhere they cannot be reached again, so
  // a whole orb always stays inside the work area on every edge.
  const clusterTop = clamp(
    ACTION_ORB_MARGIN + offset.y,
    0,
    Math.max(0, height - ACTION_ORB_SIZE),
  );
  const clusterRight = clamp(
    ACTION_ORB_MARGIN - offset.x,
    0,
    Math.max(0, width - ACTION_ORB_SIZE),
  );

  return (
    <View style={orbStyles.root}>
      <View
        style={[orbStyles.cluster, { top: clusterTop, right: clusterRight }]}
      >
        <View
          ref={dragRef}
          style={orbStyles.orbRow}
          onPointerLeave={releaseHover}
        >
          {jobs.map((job, index) => (
            <DictationActionOrb
              key={job.id}
              job={job}
              theme={theme}
              hovered={hoveredId === job.id}
              flight={orbFlight({
                origin: job.origin ?? null,
                windowWidth: width,
                clusterTop,
                clusterRight,
                slotsAfter: jobs.length - 1 - index,
              })}
              onDismiss={dismiss}
              onHoverChange={(hovered) =>
                hovered ? holdHover(job.id) : releaseHover()
              }
            />
          ))}
        </View>
        {hoveredJob ? (
          <View
            style={[
              panelStyles.panelLayer,
              // Clamping keeps an orb reachable, but the panel is far bigger
              // than an orb — so it opens on whichever side has room instead
              // of off the edge the cluster was dragged to.
              height - clusterTop - ACTION_ORB_SIZE < PANEL_CLEARANCE
                ? panelStyles.panelAbove
                : panelStyles.panelBelow,
              clusterRight + ACTION_ORB_PANEL_WIDTH > width
                ? panelStyles.panelFromLeft
                : panelStyles.panelFromRight,
            ]}
            onPointerEnter={() => holdHover(hoveredJob.id)}
            onPointerLeave={releaseHover}
          >
            <DictationActionProgressPanel
              job={hoveredJob}
              theme={theme}
              onCopy={copy}
              onPaste={paste}
              onOpenLink={openLink}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
};

/** Enough of the panel to reach its buttons without scrolling the screen. */
const PANEL_CLEARANCE = 260;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * The trip from the pill to this orb's slot, as an offset from the slot. The
 * row is right-aligned, so a slot is counted back from the cluster's right edge
 * rather than forward from its left.
 */
function orbFlight(params: {
  origin: { x: number; y: number } | null;
  windowWidth: number;
  clusterTop: number;
  clusterRight: number;
  slotsAfter: number;
}): OrbFlight | null {
  const { origin, windowWidth, clusterTop, clusterRight, slotsAfter } = params;
  if (!origin) return null;
  const slotCenterX =
    windowWidth -
    clusterRight -
    slotsAfter * (ACTION_ORB_SIZE + ACTION_ORB_GAP) -
    ACTION_ORB_SIZE / 2;
  const slotCenterY = clusterTop + ACTION_ORB_SIZE / 2;
  return { dx: origin.x - slotCenterX, dy: origin.y - slotCenterY };
}
