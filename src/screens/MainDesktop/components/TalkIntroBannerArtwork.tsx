import { createStyles } from "@/styles";
import { DESKTOP_THEME, withAlpha } from "@/styles/color";
import type { FC, ReactNode } from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  type CSSAnimationProperties,
} from "react-native-reanimated";
import bannerBackground from "./talk-intro-banner-background.jpg";
import { TalkIntroEmailScene } from "./TalkIntroEmailScene";
import { TalkIntroMessagesScene } from "./TalkIntroMessagesScene";
import { TalkIntroPill } from "./TalkIntroPill";
import { TalkIntroSpokenLine } from "./TalkIntroSpokenLine";
import {
  SCENE_FADE_MS,
  talkDemoHeardCount,
  talkDemoRevealedCount,
  talkDemoSpokenWords,
  talkDemoStep,
  useTalkIntroDemoLoop,
  type TalkDemoScene,
} from "./useTalkIntroDemoLoop";

/**
 * Figma lays the demo out on a 360px panel. Everything in it is centered, so
 * the panel can give width back to the copy down to the widest thing in it,
 * the 219px chat column, with a hair to spare on each side.
 */
export const TALK_INTRO_ARTWORK_WIDTH = 360;
export const TALK_INTRO_ARTWORK_MIN_WIDTH = 221;

/** Runs once on mount, then hands the opacity back to the dissolve. */
const SCENE_ENTER: CSSAnimationProperties = {
  animationName: { from: { opacity: 0 }, to: { opacity: 1 } },
  animationDuration: SCENE_FADE_MS,
  animationTimingFunction: "ease-out",
};

const SCENES = {
  messages: TalkIntroMessagesScene,
  email: TalkIntroEmailScene,
} satisfies Record<TalkDemoScene, FC<{ revealed: number }>>;

interface TalkIntroSceneLayerProps {
  /** Whether the scene is on its way out, making room for the next one. */
  dissolving: boolean;
  children: ReactNode;
}

/** One scene of the demo: fades in when it mounts and dissolves when told. */
const TalkIntroSceneLayer: FC<TalkIntroSceneLayerProps> = ({
  dissolving,
  children,
}) => {
  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: withTiming(dissolving ? 0 : 1, { duration: SCENE_FADE_MS }),
    }),
    [dissolving],
  );

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, SCENE_ENTER, animatedStyle]}
    >
      {children}
    </Animated.View>
  );
};

/**
 * The banner's live demo: a blurred desk behind a chat thread, then an email
 * thread, each answered by speaking into the Talk pill.
 */
export const TalkIntroBannerArtwork: FC = () => {
  const frame = useTalkIntroDemoLoop();
  const step = talkDemoStep(frame);
  const Scene = SCENES[frame.scene];
  const listening = step.kind === "listen";

  return (
    <View style={styles.panel} aria-hidden>
      <View style={styles.photoFrame} pointerEvents="none">
        <Image
          source={bannerBackground}
          style={styles.photo}
          resizeMode="stretch"
          alt=""
        />
      </View>
      <View style={styles.scrim} pointerEvents="none" />
      <TalkIntroSceneLayer
        key={frame.scene}
        dissolving={step.kind === "dissolve"}
      >
        <Scene revealed={talkDemoRevealedCount(frame)} />
        <TalkIntroSpokenLine
          words={talkDemoSpokenWords(frame)}
          heardCount={talkDemoHeardCount(frame)}
          visible={listening}
        />
      </TalkIntroSceneLayer>
      <TalkIntroPill listening={listening} />
    </View>
  );
};

const styles = createStyles({
  panel: {
    width: TALK_INTRO_ARTWORK_WIDTH,
    minWidth: TALK_INTRO_ARTWORK_MIN_WIDTH,
    flexShrink: 1,
    backgroundColor: DESKTOP_THEME.grey950,
    overflow: "hidden",
  },
  // The photo hangs past the panel on every side so the blur has no hard edge.
  photoFrame: {
    position: "absolute",
    left: -42,
    right: -25,
    top: -27,
    height: 281,
    // Web and Electron only: react-native-web maps `filter` to CSS; native
    // views have no equivalent, and the banner never renders there.
    ...(Platform.OS === "web" && { filter: "blur(14px)" }),
  },
  photo: {
    position: "absolute",
    left: 22,
    right: -22,
    top: -202,
    height: 684,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: withAlpha(DESKTOP_THEME.grey1100, 0.4),
  },
});
