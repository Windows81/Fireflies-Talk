import { createStyles, useTheme } from "@/styles";
import { LinearGradient } from "expo-linear-gradient";
import { type FC, type ReactNode, useState } from "react";
import { type LayoutChangeEvent, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import type { DesktopNotepadMeeting } from "../../types";
import { NotepadInstantSummary } from "./NotepadInstantSummary";
import { PolishingPill } from "./PolishingPill";

// Skimmer: the bg-colored gradient that fades the quick summary out just below
// the reveal line. Height and the pill's vertical offset match the Figma spec.
const SKIMMER_HEIGHT = 92;
const PILL_HALF_HEIGHT = 20;

interface Props {
  meeting: DesktopNotepadMeeting;
  instantContent: string;
  // While false the quick summary is shown with the "Polishing" frontier resting
  // at the top. When true the general summary (children) wipes down over the
  // quick summary as `progress` runs 0→1, and the frontier (line + pill) rides
  // the reveal edge from top to bottom.
  revealing: boolean;
  progress: SharedValue<number>;
  children?: ReactNode;
}

/**
 * Bridges the quick summary → general summary transition. The quick summary sits
 * underneath; the general summary is clipped by an animated height so it wipes
 * down from the top, and a horizontal line with the "Polishing your notes" pill
 * centered on it marks — and follows — the reveal edge.
 */
export const SummaryReveal: FC<Props> = ({
  meeting,
  instantContent,
  revealing,
  progress,
  children,
}) => {
  const theme = useTheme();
  const [contentHeight, setContentHeight] = useState(0);

  const curtainStyle = useAnimatedStyle(() => ({
    height: contentHeight * progress.value,
  }));

  // The frontier (line + pill) tracks the bottom edge of the revealed general
  // summary as it wipes down.
  const frontierStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentHeight * progress.value }],
  }));

  const onMeasure = (e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.height;
    if (next > 0 && next !== contentHeight) setContentHeight(next);
  };

  return (
    <View style={styles.root}>
      {/* Quick (instant) summary stays fully visible beneath the reveal. */}
      <View>
        <NotepadInstantSummary
          meeting={meeting}
          content={instantContent}
          isCompleted
        />
      </View>

      {/* General summary wipes down over the quick summary (opaque bg so the
          quick summary never shows through). The reveal edge is marked by a
          bright line; below it a bg-colored "skimmer" gradient fades the quick
          summary out, and the pill is centered on the line. All follow the edge
          top→bottom. (While polishing, the pill instead floats at the bottom —
          owned by NotepadSummary.) */}
      {revealing && (
        <>
          <Animated.View style={[styles.curtain(theme), curtainStyle]}>
            <View onLayout={onMeasure}>{children}</View>
          </Animated.View>
          <Animated.View
            style={[styles.frontier, frontierStyle]}
            pointerEvents="none"
          >
            {/* Skimmer: fades the quick summary out just below the line. */}
            <LinearGradient
              colors={[
                theme.colors.layerSubtle,
                theme.colors.layerSubtle,
                "transparent",
              ]}
              locations={[0, 0.3553, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.skimmer}
            />
            {/* Reveal line: bright, fading out toward its left/right edges. */}
            <LinearGradient
              colors={[
                "transparent",
                theme.colors.textPrimary,
                theme.colors.textPrimary,
                "transparent",
              ]}
              locations={[0, 0.15, 0.85, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.line}
            />
            <View style={styles.pillWrap}>
              <PolishingPill />
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
};

const styles = createStyles({
  root: {
    position: "relative",
  },
  curtain: (theme) => ({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
    backgroundColor: theme.colors.layerSubtle,
  }),
  // Positioned at the reveal edge; translateY moves it top→bottom. Children are
  // absolute, anchored to this top-left (the edge).
  frontier: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  // bg-colored fade over the quick summary, starting at the line.
  skimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SKIMMER_HEIGHT,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  // Reveal line: a bright bar (color/edge-fade come from the gradient), centered
  // on the edge.
  line: {
    position: "absolute",
    top: -1,
    left: 0,
    right: 0,
    height: 2,
  },
  // Pill centered on the line.
  pillWrap: {
    position: "absolute",
    top: -PILL_HALF_HEIGHT,
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
