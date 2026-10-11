import { IconFileText, IconFred, IconLogo, IconMaximize2 } from "@/assets/svg";
import type { DictationPillSide } from "electron/src/types";
import { Pressable } from "react-native";
import { createStyles, useTheme } from "@/styles";
import {
  type FC,
  type RefObject,
  useMemo,
  useRef,
  useState,
  memo,
} from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { useGlassSync } from "../../../hooks/useGlassSync";
import { useLiveBarHover } from "./useLiveBarHover";
import {
  LIVE_BAR_HEIGHT,
  LIVE_BAR_LOGO_GAP,
  LIVE_BAR_LOGO_SIZE,
  LIVE_BAR_TOP_PADDING,
} from "electron/src/dictation/dictation-live-anchor";
import { GLOBAL, withAlpha } from "@/styles/color";
import {
  capsuleBackdrop,
  SHELL_BORDER_REST,
} from "@/screens/DictationPill/dictationPillStyles";
import { LiveBarTab } from "./LiveBarTab";
import { useLiveBarInOutAnimation } from "./useLiveBarInOutAnimation";
import { useFloatingWindowDrag } from "@/hooks/useFloatingWindowDrag";
import { LiveBarPillContent } from "./LiveBarPillContent";
import {
  type TooltipAlign,
  type TooltipPosition,
} from "@/components/HoverTooltip";
import { LiveBarStopControls } from "./LiveBarStopControls";
import { ThreeDotBouncingAnim } from "./ThreeDotBouncing";
import type { MeetingNotesPrivacy } from "@firefliesai/mobile-ff.graphql-client";

interface LiveBarRailStopSlotProps {
  visible: boolean;
  glassRef: RefObject<View | null>;
  isHovered: boolean;
  tooltipPosition: TooltipPosition;
  tooltipAlign: TooltipAlign;
  recordingState?: "inactive" | "recording" | "paused";
  onPauseClick?: () => void;
  onStopClick?: () => void;
}

type DesktopHeaderCompactProps = {
  /** Vertical icon rail for a side-docked bar. */
  vertical?: boolean;
  /** Bottom dock: the bar sits at the window's foot and pads away from it. */
  growsUpward?: boolean;
  /** Which screen edge the bar is docked to — decides where tooltips can go. */
  dockSide?: DictationPillSide;
  /** Fires when a drag begins, so open panels can be put away first. */
  onDragStart?: () => void;
  activeLiveAssist?: boolean;
  activeAskFred?: boolean;
  activeNotes?: boolean;
  onToggleLiveAssist?: () => void;
  onToggleAskFred?: () => void;
  onToggleNotes?: () => void;
  onStopClick?: () => void;
  onPauseClick?: () => void;
  meetingStartTime?: Date | null;
  showStopPauseButton: boolean;
  meetingPrivacy?: MeetingNotesPrivacy;
  onChangePrivacy?: (privacy: MeetingNotesPrivacy) => void;
  isHost?: boolean;
  recordingState?: "inactive" | "recording" | "paused";
  // Whether any live-bar window/panel is open; while true the bar won't collapse.
  anyWindowOpen: boolean;
};

export const IconFredBig: FC = () => {
  return <IconFred width={20} height={20} />;
};

// Memoized animated dots icon component to prevent re-mounting
const AnimatedDotsIcon = memo(() => (
  <View style={styles.animatedDotsContainer}>
    <ThreeDotBouncingAnim showMessages={false} renderAnimImmediate={true} />
  </View>
));

AnimatedDotsIcon.displayName = "AnimatedDotsIcon";

function LiveBarRailStopSlot({
  visible,
  glassRef,
  isHovered,
  tooltipPosition,
  tooltipAlign,
  recordingState,
  onPauseClick,
  onStopClick,
}: LiveBarRailStopSlotProps) {
  if (!visible) {
    return <View style={styles.railStopReserve} pointerEvents="none" />;
  }

  const pointerEvents = isHovered ? "auto" : "none";
  const chromeStyle = !isHovered && styles.railCircleHidden;

  return (
    <LiveBarStopControls
      vertical
      glassRef={glassRef}
      pointerEvents={pointerEvents}
      style={chromeStyle}
      tooltipPosition={tooltipPosition}
      tooltipAlign={tooltipAlign}
      recordingState={recordingState}
      onPauseClick={onPauseClick}
      onStopClick={onStopClick}
    />
  );
}

export const DesktopHeaderCompact: FC<
  DesktopHeaderCompactProps & {
    minimized?: boolean;
    onToggleMinimized?: () => void;
    onToggleViewMode?: () => void;
  }
> = ({
  activeLiveAssist = true,
  activeAskFred = true,
  activeNotes = false,
  onToggleLiveAssist,
  onToggleAskFred,
  onToggleNotes,
  onStopClick,
  onPauseClick,
  onToggleViewMode,
  anyWindowOpen,
  // minimized / onToggleMinimized / meetingStartTime / meetingPrivacy /
  // onChangePrivacy / isHost stay on the type for callers but are unused here.
  showStopPauseButton,
  recordingState,
  vertical,
  growsUpward,
  dockSide,
  onDragStart,
}) => {
  const theme = useTheme();

  // Tooltips are portalled at fixed coordinates and the window is sized to its
  // content, so anything aimed past an edge is clipped. Point them back inward:
  // up out of the rail on a side dock, and away from the docked edge otherwise.
  const tooltipPosition = vertical || growsUpward ? "top" : "bottom";
  const tooltipAlign = !vertical
    ? "center"
    : dockSide === "right"
      ? "end"
      : "start";

  // The bar rests as a pill and expands while hovered; it auto-collapses after
  // an idle delay unless a window is open (see useLiveBarHover).
  const barRef = useRef<View>(null);
  const { collapsed, isHovered } = useLiveBarHover(barRef, anyWindowOpen);
  // Dragging a bar with panels hanging off it is unwieldy, so they close as
  // soon as the drag begins and the bar travels on its own.
  const dragHandlers = useMemo(
    () => ({
      onStart: () => {
        onDragStart?.();
        window.electron?.liveView?.startBarDrag?.();
      },
      onEnd: () => window.electron?.liveView?.endBarDrag?.(),
    }),
    [onDragStart],
  );
  useFloatingWindowDrag(barRef, dragHandlers);
  const expanded = !collapsed;

  const {
    barStyle,
    contentStyle,
    pillStyle,
    leftSideStyle,
    rightSideStyle,
    onBarContentLayout,
  } = useLiveBarInOutAnimation(expanded, isHovered);

  // Glass sits on each box, which animates only layout props (width / height /
  // border / margin) — never opacity — so the native vibrancy tracks the
  // morphing rect. The fade lives on the content inside each box, off the glass.
  const [maximizeHovered, setMaximizeHovered] = useState(false);
  const barGlassRef = useGlassSync("liveHeaderBig", true, LIVE_BAR_HEIGHT / 2);
  const maximizeGlassRef = useGlassSync(
    "liveHeaderMaximize",
    isHovered,
    LIVE_BAR_HEIGHT / 2,
  );
  const closeGlassRef = useGlassSync(
    "liveHeaderClose",
    showStopPauseButton && isHovered,
    LIVE_BAR_HEIGHT / 2,
  );

  if (vertical) {
    return (
      <View ref={barRef} style={styles.railRoot}>
        <View
          ref={maximizeGlassRef}
          style={[
            styles.content(theme),
            styles.railCircle,
            !isHovered && styles.railCircleHidden,
          ]}
          pointerEvents={isHovered ? "auto" : "none"}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open full screen mode"
            onPress={() => onToggleViewMode?.()}
            onHoverIn={() => setMaximizeHovered(true)}
            onHoverOut={() => setMaximizeHovered(false)}
            style={[
              styles.iconButton,
              maximizeHovered && styles.iconButtonHovered,
            ]}
          >
            <IconMaximize2 width={14} height={14} color={maximizeColor} />
          </Pressable>
        </View>
        <View ref={barGlassRef} style={[styles.bar(theme), styles.railBar]}>
          <IconLogo
            width={LIVE_BAR_LOGO_SIZE}
            height={LIVE_BAR_LOGO_SIZE}
            style={styles.railLogo}
          />
          <LiveBarTab
            compact
            label="Live Assist"
            active={!!activeLiveAssist}
            onPress={() => onToggleLiveAssist?.()}
            leading={<AnimatedDotsIcon />}
          />
          <LiveBarTab
            compact
            label="AskFred"
            active={!!activeAskFred}
            onPress={() => onToggleAskFred?.()}
            leading={<IconFred width={16} height={16} />}
          />
          <LiveBarTab
            compact
            label="Notes"
            active={!!activeNotes}
            onPress={() => onToggleNotes?.()}
            leading={
              <IconFileText width={16} height={16} color={maximizeColor} />
            }
          />
        </View>
        <LiveBarRailStopSlot
          visible={showStopPauseButton}
          glassRef={closeGlassRef}
          isHovered={isHovered}
          tooltipPosition={tooltipPosition}
          tooltipAlign={tooltipAlign}
          recordingState={recordingState}
          onPauseClick={onPauseClick}
          onStopClick={onStopClick}
        />
      </View>
    );
  }

  return (
    <View ref={barRef} style={[styles.root, growsUpward && styles.rootUpward]}>
      <Animated.View
        ref={maximizeGlassRef}
        pointerEvents={isHovered ? "auto" : "none"}
        style={[
          styles.content(theme),
          styles.maximizeButtonContainer(theme),
          leftSideStyle,
        ]}
      >
        <Animated.View style={[styles.sideContent, contentStyle]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open full screen mode"
            onPress={() => onToggleViewMode?.()}
            onHoverIn={() => setMaximizeHovered(true)}
            onHoverOut={() => setMaximizeHovered(false)}
            style={[
              styles.iconButton,
              maximizeHovered && styles.iconButtonHovered,
            ]}
          >
            <IconMaximize2 width={14} height={14} color={maximizeColor} />
          </Pressable>
        </Animated.View>
      </Animated.View>

      <Animated.View ref={barGlassRef} style={[styles.bar(theme), barStyle]}>
        <Animated.View
          style={[styles.pillContent, pillStyle]}
          pointerEvents={expanded ? "none" : "auto"}
        >
          <LiveBarPillContent />
        </Animated.View>

        <Animated.View
          style={[styles.barContent, contentStyle]}
          pointerEvents={expanded ? "auto" : "none"}
          onLayout={onBarContentLayout}
        >
          <IconLogo
            width={LIVE_BAR_LOGO_SIZE}
            height={LIVE_BAR_LOGO_SIZE}
            style={styles.barLogo}
          />
          <LiveBarTab
            label="Live Assist"
            active={!!activeLiveAssist}
            onPress={() => onToggleLiveAssist?.()}
            leading={<AnimatedDotsIcon />}
          />
          <LiveBarTab
            label="AskFred"
            active={!!activeAskFred}
            onPress={() => onToggleAskFred?.()}
          />
          <LiveBarTab
            label="Notes"
            active={!!activeNotes}
            onPress={() => onToggleNotes?.()}
          />
        </Animated.View>
      </Animated.View>

      {/* Pause/stop are host-only — non-hosts (e.g. bot-call participants) see no controls. */}
      {showStopPauseButton && (
        <LiveBarStopControls
          glassRef={closeGlassRef}
          pointerEvents={isHovered ? "auto" : "none"}
          tooltipPosition={tooltipPosition}
          tooltipAlign={tooltipAlign}
          style={rightSideStyle}
          recordingState={recordingState}
          onPauseClick={onPauseClick}
          onStopClick={onStopClick}
        />
      )}
    </View>
  );
};

const maximizeColor = withAlpha(GLOBAL.white, 0.82);

const styles = createStyles({
  railRoot: {
    // No alignSelf: the rail pins to the top of the row so it stays put as the
    // window grows taller for panels opening beside it.
    alignItems: "center",
    flexDirection: "column",
    gap: 8,
    paddingTop: LIVE_BAR_TOP_PADDING,
  },
  railCircle: {
    width: LIVE_BAR_HEIGHT,
    justifyContent: "center",
  },
  // Hover-only chrome, but it keeps its slot — collapsing it would slide the
  // whole rail every time the cursor arrives or leaves.
  railCircleHidden: {
    opacity: 0,
  },
  // Guest rails omit pause/stop, but the host geometry still budgets that
  // capsule. Keep the empty slot so the rail stays centred on the pill.
  railStopReserve: {
    width: LIVE_BAR_HEIGHT,
    height: LIVE_BAR_HEIGHT * 2,
  },
  // Inset to match a tab's own text inset, so the mark lines up with the
  // labels rather than hugging the bar's border.
  barLogo: {
    marginLeft: 12,
  },
  railLogo: {
    marginTop: LIVE_BAR_LOGO_GAP,
    marginBottom: LIVE_BAR_LOGO_GAP,
  },
  railBar: {
    borderRadius: LIVE_BAR_HEIGHT / 2,
    flexDirection: "column",
    alignItems: "center",
    gap: 0,
    width: LIVE_BAR_HEIGHT,
  },
  root: {
    alignSelf: "center",
    alignItems: "flex-start",
    flexDirection: "row",
    paddingTop: LIVE_BAR_TOP_PADDING,
  },
  // Growing upward puts this slot at the window's foot, so the padding has to
  // move to the underside — otherwise the bar sits flush with the window edge
  // and its centre lands LIVE_BAR_TOP_PADDING below where the pill was.
  rootUpward: {
    paddingTop: 0,
    paddingBottom: LIVE_BAR_TOP_PADDING,
  },
  // Same dark glass capsule as the dictation pill it takes over from.
  bar: (theme) => ({
    position: "relative",
    overflow: "hidden",
    backgroundColor: theme.colors.dictationPillSurface,
    borderColor: SHELL_BORDER_REST,
    borderWidth: 1,
    ...capsuleBackdrop,
    boxShadow: `0 10px 28px ${withAlpha(GLOBAL.grey900, 0.3)}`,
  }),
  barContent: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  sideContent: {
    height: "100%",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  // Side capsules sit beside the bar and share its surface.
  content: (theme) => ({
    flexDirection: "row",
    borderRadius: LIVE_BAR_HEIGHT / 2,
    overflow: "hidden",
    gap: 0,
    backgroundColor: theme.colors.dictationPillSurface,
    borderColor: SHELL_BORDER_REST,
    ...capsuleBackdrop,
    boxShadow: `0 10px 28px ${withAlpha(GLOBAL.grey900, 0.3)}`,
    borderWidth: 1,
    height: LIVE_BAR_HEIGHT,
  }),
  maximizeButtonContainer: (theme) => ({
    height: LIVE_BAR_HEIGHT,
    width: LIVE_BAR_HEIGHT,
    borderRadius: LIVE_BAR_HEIGHT / 2,
    borderWidth: 1,
    borderColor: SHELL_BORDER_REST,
    backgroundColor: theme.colors.dictationPillSurface,
    ...capsuleBackdrop,
    boxShadow: `0 10px 28px ${withAlpha(GLOBAL.grey900, 0.3)}`,
  }),
  logoButton: {
    height: 36,
    width: 22,
    paddingLeft: 6,
    paddingRight: 4,
    alignContent: "center",
    justifyContent: "center",
  },
  liveAssistButton: {
    width: 114,
    borderRadius: 0,
    paddingHorizontal: 0,
  },
  askFredButton: {
    width: 70,
    borderRadius: 0,
    paddingLeft: 8,
  },
  notesButton: {
    width: 55,
    borderRadius: 0,
    padding: 0,
  },
  iconButton: {
    height: "100%",
    width: "100%",
    borderRadius: LIVE_BAR_HEIGHT / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonHovered: {
    backgroundColor: withAlpha(GLOBAL.white, 0.12),
  },
  noteButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  animatedDotsContainer: {
    transform: [{ scale: 0.6 }],
  },
  draggableSeperator: (theme) => ({
    width: 1,
    height: 8,
    backgroundColor: theme.colors.interactiveSecondaryHover,
    alignSelf: "center",
  }),
  draggableButtonBorder: {
    paddingVertical: 2,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
  },
});
