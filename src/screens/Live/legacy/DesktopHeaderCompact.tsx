import {
  IconFred,
  IconLogo,
  IconMaximize2,
  IconMoreHorizontal,
} from "@/assets/svg";
import { Button } from "@/components/Button";
import { createStyles, useTheme, vars } from "@/styles";
import { type FC, useRef, memo } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { Text } from "@/components/Typography";
import { useGlassSync } from "@/hooks/useGlassSync";
import { useLiveBarHover } from "./useLiveBarHover";
import { useLiveBarInOutAnimation } from "./useLiveBarInOutAnimation";
import { LiveBarPillContent } from "./LiveBarPillContent";
import { LiveBarStopControls } from "./LiveBarStopControls";
import { ThreeDotBouncingAnim } from "../components/ThreeDotBouncing";
import type { MeetingNotesPrivacy } from "@firefliesai/mobile-ff.graphql-client";
import { HoverTooltip } from "@/components/HoverTooltip";

type DesktopHeaderCompactProps = {
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

const IconMore = () => <IconMoreHorizontal color={vars.colors.purple300} />;

AnimatedDotsIcon.displayName = "AnimatedDotsIcon";

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
}) => {
  const theme = useTheme();

  // The bar rests as a pill and expands while hovered; it auto-collapses after
  // an idle delay unless a window is open (see useLiveBarHover).
  const barRef = useRef<View>(null);
  const collapsed = useLiveBarHover(barRef, anyWindowOpen);
  const expanded = !collapsed;

  const {
    barStyle,
    contentStyle,
    pillStyle,
    leftSideStyle,
    rightSideStyle,
    onBarContentLayout,
  } = useLiveBarInOutAnimation(expanded);

  // Glass sits on each box, which animates only layout props (width / height /
  // border / margin) — never opacity — so the native vibrancy tracks the
  // morphing rect. The fade lives on the content inside each box, off the glass.
  const barGlassRef = useGlassSync("liveHeaderBig", true, 8);
  const maximizeGlassRef = useGlassSync("liveHeaderMaximize", expanded, 8);
  const closeGlassRef = useGlassSync(
    "liveHeaderClose",
    expanded && showStopPauseButton,
    8,
  );

  return (
    <View ref={barRef} style={styles.root}>
      <Animated.View
        ref={maximizeGlassRef}
        style={[
          styles.content(theme),
          styles.maximizeButtonContainer(theme),
          leftSideStyle,
        ]}
      >
        <Animated.View style={[styles.sideContent, contentStyle]}>
          <HoverTooltip label="Open full screen mode" position="bottom">
            <Button
              variant="transparentNeutral"
              Icon={IconMaximize2}
              iconSize={14}
              style={styles.iconButton}
              size="xs"
              onPress={() => onToggleViewMode?.()}
            />
          </HoverTooltip>
        </Animated.View>
      </Animated.View>

      <Animated.View
        testID="drag"
        ref={barGlassRef}
        style={[styles.bar(theme), barStyle]}
      >
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
          <View testID="drag" style={styles.draggablePadding} />
          <View testID="drag" style={styles.logoButton}>
            <IconLogo width={12} height={12} />
          </View>

          <View testID="drag" style={styles.draggableSeperator(theme)} />
          <View style={styles.draggableButtonBorder}>
            <Button
              variant={activeLiveAssist ? "secondary" : "transparentNeutral"}
              Icon={activeLiveAssist ? IconMore : AnimatedDotsIcon}
              size="sm"
              style={styles.liveAssistButton}
              onPress={() => onToggleLiveAssist?.()}
            >
              <Text variant="title3Regular" color="textSecondary">
                Live Assist
              </Text>
            </Button>
          </View>
          <View style={styles.draggableSeperator(theme)} />
          <View style={styles.draggableButtonBorder}>
            <Button
              variant={activeAskFred ? "secondary" : "transparentNeutral"}
              size="sm"
              style={styles.askFredButton}
              onPress={() => onToggleAskFred?.()}
            >
              <Text variant="title3Regular" color="textSecondary">
                AskFred
              </Text>
            </Button>
          </View>
          <View style={styles.draggableSeperator(theme)} />
          <View style={styles.draggableButtonBorder}>
            <Button
              variant={activeNotes ? "secondary" : "transparentNeutral"}
              size="sm"
              style={styles.notesButton}
              onPress={() => onToggleNotes?.()}
            >
              <View style={styles.noteButtonContainer}>
                <Text variant="title3Regular" color="textSecondary">
                  Notes
                </Text>
              </View>
            </Button>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Pause/stop are host-only — non-hosts (e.g. bot-call participants) see no controls. */}
      {showStopPauseButton && (
        <LiveBarStopControls
          glassRef={closeGlassRef}
          style={rightSideStyle}
          contentStyle={contentStyle}
          recordingState={recordingState}
          onPauseClick={onPauseClick}
          onStopClick={onStopClick}
        />
      )}
    </View>
  );
};

const styles = createStyles({
  root: {
    alignSelf: "center",
    alignItems: "flex-start",
    flexDirection: "row",
    paddingTop: 8,
  },
  bar: (theme) => ({
    ...vars.elevations[3],
    position: "relative",
    overflow: "hidden",
    backgroundColor: theme.colors.pageBackground,
    borderColor: theme.colors.borderStaticSubtle,
    borderWidth: 1,
    boxShadow:
      "0px 0px 4px 2px rgba(255, 255, 255, 0.16) inset, 0px 4px 4px rgba(0, 0, 0, 0.1)",
  }),
  barContent: {
    position: "absolute",
    top: 0,
    left: 0,
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
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
    height: 36,
  },
  content: (theme) => ({
    ...vars.elevations[3],
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    gap: 3,
    backgroundColor: theme.colors.pageBackground,
    borderColor: theme.colors.borderStaticSubtle,
    boxShadow:
      "0px 0px 4px 2px rgba(255, 255, 255, 0.16) inset, 0px 4px 4px rgba(0, 0, 0, 0.1)",
    borderWidth: 1,
    height: 36,
  }),
  maximizeButtonContainer: (theme) => ({
    height: 36,
    width: 36,
    boxShadow:
      "0px 0px 4px 2px rgba(255, 255, 255, 0.16) inset, 0px 4px 4px rgba(0, 0, 0, 0.1)",
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    backgroundColor: theme.colors.pageBackground,
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
    height: 36,
    width: 36,
    paddingRight: 2,
    paddingBottom: 2,
  },
  noteButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  animatedDotsContainer: {
    transform: [{ scale: 0.6 }],
    marginTop: -6,
  },
  draggableSeperator: (theme) => ({
    width: 1,
    height: 8,
    backgroundColor: theme.colors.interactiveSecondaryHover,
    alignSelf: "center",
  }),
  draggablePadding: {
    width: 4,
    height: "100%",
  },
  draggableButtonBorder: {
    paddingVertical: 2,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
  },
});
