import { RouteNames } from "@/constants";
import { RootNavigation } from "@/screens/RootNavigation";
import type { FC, ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";

const EDGE_WIDTH = 24;
const OPEN_TRANSLATION = 56;
const OPEN_VELOCITY = 500;

/**
 * Wraps the Home content and opens the You screen when a drag — or a quick
 * flick — starts within the left edge and moves right, mirroring the
 * hamburger's slide-from-left. The gesture is an ancestor of the feed rather
 * than an overlay, so taps and vertical scroll still reach the list.
 */
export const LeftEdgeSwipe: FC<{ children: ReactNode }> = ({ children }) => {
  const openProfile = () => {
    RootNavigation.navigate(RouteNames.You, { fromLeft: true });
  };

  const pan = Gesture.Pan()
    .hitSlop({ left: 0, width: EDGE_WIDTH })
    .activeOffsetX(12)
    .failOffsetY([-12, 12])
    .onEnd((e, success) => {
      if (!success) return;
      if (e.translationX > OPEN_TRANSLATION || e.velocityX > OPEN_VELOCITY) {
        scheduleOnRN(openProfile);
      }
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.container}>{children}</View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
