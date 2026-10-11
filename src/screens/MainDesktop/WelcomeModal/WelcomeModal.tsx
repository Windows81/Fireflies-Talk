import { BaseModal } from "@/components/Dialog";
import { Button } from "@/components/Button";
import {
  DESKTOP_FIRST_TIME_DEMO_FLAG_KEY,
  DESKTOP_WELCOME_MODAL_SHOWN_FLAG_KEY,
  getLocalUserFlag,
  setLocalUserFlag,
  userLocalUserFlagsStore,
} from "@/features/user-flags";
import { DESKTOP_THEME } from "@/styles/color";
import { isDesktop, isMainDesktopWindow } from "@/utils/device";
import { type FC, useCallback, useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { CaptureWithoutBotPanel } from "./panels/CaptureWithoutBotPanel";
import { AskFredPanel } from "./panels/AskFredPanel";
import { LiveAssistPanel } from "./panels/LiveAssistPanel";
import { WelcomeModalHeader } from "./components/WelcomeModalHeader";

const webBlurStyle = StyleSheet.create({
  blur: { backdropFilter: "blur(8px)" } as never,
}).blur;

const STAGE_BACKDROP_MS = 0;
const STAGE_CARD_MS = 280;
const STAGE_ELEMENTS_START_MS = 620;
const STAGE_ELEMENTS_STEP_MS = 120;

const CARD_DESIGN_WIDTH = 1228;
const CARD_HORIZONTAL_MARGIN = 64;
const MIN_CARD_SCALE = 0.75;

const selectIsFirstTimeDemoDone = (
  state: ReturnType<typeof userLocalUserFlagsStore.getState>,
) => !!state.flags[DESKTOP_FIRST_TIME_DEMO_FLAG_KEY];

export const WelcomeModal: FC = () => {
  const [dismissed, setDismissed] = useState(
    () => !!getLocalUserFlag(DESKTOP_WELCOME_MODAL_SHOWN_FLAG_KEY),
  );

  const isFirstTimeDemoDone = userLocalUserFlagsStore(
    selectIsFirstTimeDemoDone,
  );

  const { width: windowWidth } = useWindowDimensions();
  const cardScale = Math.max(
    MIN_CARD_SCALE,
    Math.min(1, (windowWidth - CARD_HORIZONTAL_MARGIN) / CARD_DESIGN_WIDTH),
  );

  const handleClose = useCallback(() => {
    setLocalUserFlag(DESKTOP_WELCOME_MODAL_SHOWN_FLAG_KEY, true);
    setDismissed(true);
  }, []);

  const shouldRender =
    isDesktop && isMainDesktopWindow() && isFirstTimeDemoDone && !dismissed;

  if (!shouldRender) return null;

  return (
    <BaseModal visible transparent onRequestClose={handleClose}>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel="Close welcome"
        onPress={handleClose}
        style={[styles.overlay, webBlurStyle]}
        entering={FadeIn.duration(260).delay(STAGE_BACKDROP_MS)}
      >
        <AnimatedPressable
          style={[styles.card, { transform: [{ scale: cardScale }] }]}
          onPress={() => {}}
          entering={FadeIn.duration(220).delay(STAGE_CARD_MS)}
        >
          <Animated.View
            entering={FadeInUp.duration(320)
              .delay(STAGE_ELEMENTS_START_MS)
              .springify()
              .damping(18)}
          >
            <WelcomeModalHeader />
          </Animated.View>

          <View style={styles.grid}>
            <Animated.View
              style={styles.column}
              entering={FadeInUp.duration(320)
                .delay(STAGE_ELEMENTS_START_MS + STAGE_ELEMENTS_STEP_MS)
                .springify()
                .damping(18)}
            >
              <CaptureWithoutBotPanel />
            </Animated.View>
            <Animated.View
              style={styles.column}
              entering={FadeInUp.duration(320)
                .delay(STAGE_ELEMENTS_START_MS + STAGE_ELEMENTS_STEP_MS * 2)
                .springify()
                .damping(18)}
            >
              <AskFredPanel />
            </Animated.View>
            <Animated.View
              style={styles.column}
              entering={FadeInUp.duration(320)
                .delay(STAGE_ELEMENTS_START_MS + STAGE_ELEMENTS_STEP_MS * 3)
                .springify()
                .damping(18)}
            >
              <LiveAssistPanel />
            </Animated.View>
          </View>

          <Animated.View
            style={styles.buttonContainer}
            entering={FadeInUp.duration(320)
              .delay(STAGE_ELEMENTS_START_MS + STAGE_ELEMENTS_STEP_MS * 4)
              .springify()
              .damping(18)}
          >
            <Button
              variant="primary"
              onPress={handleClose}
              style={styles.button}
            >
              Get Started
            </Button>
          </Animated.View>
        </AnimatedPressable>
      </AnimatedPressable>
    </BaseModal>
  );
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  card: {
    width: 1228,
    flexShrink: 0,
    backgroundColor: DESKTOP_THEME.grey1000,
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  grid: {
    flexDirection: "row",
    gap: 12,
  },
  column: {
    flex: 1,
  },
  buttonContainer: {
    alignItems: "center",
    marginTop: 24,
    paddingBottom: 8,
  },
  button: {
    width: 200,
  },
});
