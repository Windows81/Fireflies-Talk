import { NAVBAR_HEIGHT, useBottomInset } from "@/constants";
import { useScreenType } from "@/utils/screen-type";
import { Breakpoint, createStyles, useTheme } from "@/styles";
import { GLOBAL, withAlpha } from "@/styles/color";
import BottomSheet, {
  BottomSheetView,
  useBottomSheet,
} from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type ReactNode,
  type RefObject,
} from "react";
import {
  Platform,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Shared mechanics for the dock-and-expand floating cards (the recorder bar
 * and the live-meeting bar): a full-width bar docked above the bottom
 * navigation that expands into a full-screen sheet in place.
 *
 * Owns everything neither card should reimplement — sheet sizing and snap
 * points, the enter/exit animation and the mounted window around it, the
 * navbar-hide interpolation, safe-area padding, and collapsing on navigation.
 * Each card supplies only its own visibility rule, bar, and expanded content.
 */

// @gorhom/bottom-sheet's default handle: 10px padding around a 4px indicator.
const SHEET_HANDLE_HEIGHT = 24;

const SHEET_MAX_WIDTH = 500;

// Past the Medium breakpoint — web, and any tablet (or large phone) in
// landscape — the sheet floats beside page content, but @gorhom's hosting
// container clips at its own edge (overflow: hidden) and cuts the shadow off.
// So the container runs this much wider than the sheet, which keeps its full
// width. A 24px blur is a gaussian of sigma 12, still ~2% opaque at 16px, so
// anything tighter than ~2 sigma leaves a visible seam where it is clipped.
const SHEET_SHADOW_GUTTER = 32;

const ENTER_TIMING = { duration: 280, easing: Easing.out(Easing.cubic) };
const EXIT_FADE_DELAY_MS = 225;
const EXIT_TIMING = { duration: 120, easing: Easing.linear };

const AnimatedIndexContext = createContext<SharedValue<number> | null>(null);

export const FloatingSheetCard: FC<{
  /** Route the card belongs to; it hides while that route is on screen. */
  activeRoute: Parameters<typeof useScreenType>[0];
  isVisible: boolean;
  /** Height of the docked bar, excluding the bottom safe-area inset. */
  compactHeight: number;
  sheetRef: RefObject<BottomSheet | null>;
  children: ReactNode;
}> = ({ activeRoute, isVisible, compactHeight, sheetRef, children }) => {
  useAnimatedKeyboard(); // prevents keyboard to push the bottom sheet up
  const theme = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  const screenType = useScreenType(activeRoute);
  const navigation = useNavigation();
  const bottomInset = useBottomInset();
  const animatedIndexShared = useSharedValue(0);
  const mountOffset = useSharedValue(0);
  const exitOpacity = useSharedValue(1);
  const [isMounted, setIsMounted] = useState(false);

  const isLargeScreen = theme.breakpoint >= Breakpoint.Medium;

  useEffect(() => {
    return navigation.addListener("state", () => {
      sheetRef.current?.collapse();
    });
  }, [navigation, sheetRef]);

  // Portrait: the sheet covers the whole screen and the content pads itself
  // below the status bar. Landscape is shallow enough that a full-height sheet
  // reads as a page, so there it stops short of the top edge.
  const expandedHeight = isLandscape ? screenHeight * 0.9 : screenHeight;

  const snapPoints = useMemo(() => {
    return [
      compactHeight + (screenType === "main" ? 0 : bottomInset),
      expandedHeight,
    ];
  }, [compactHeight, expandedHeight, bottomInset, screenType]);

  // Stays mounted through the exit animation, so the bar fades out instead
  // of vanishing between frames.
  const hiddenOffset = compactHeight + bottomInset;

  useEffect(() => {
    if (isVisible) {
      setIsMounted(true);
      exitOpacity.value = 1;
      mountOffset.value = hiddenOffset;
      mountOffset.value = withTiming(0, ENTER_TIMING);
      return;
    }
    // The collapse leads; the fade catches its tail and finishes the exit.
    sheetRef.current?.collapse();
    exitOpacity.value = withDelay(
      EXIT_FADE_DELAY_MS,
      withTiming(0, EXIT_TIMING, (finished) => {
        if (finished) runOnJS(setIsMounted)(false);
      }),
    );
  }, [isVisible, hiddenOffset, sheetRef, exitOpacity, mountOffset]);

  if (!isMounted) return null;

  return (
    <AnimatedContainer
      screenType={screenType}
      bottomInset={bottomInset}
      isLargeScreen={isLargeScreen}
      containerHeight={screenHeight}
      animatedIndexShared={animatedIndexShared}
      mountOffset={mountOffset}
      exitOpacity={exitOpacity}
    >
      <BottomSheet
        ref={sheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        enableHandlePanningGesture={true}
        enableContentPanningGesture={true}
        maxDynamicContentSize={expandedHeight}
        enableOverDrag={false}
        enableDynamicSizing={false}
        accessible={false}
        accessibilityLabel={null}
        accessibilityRole={null}
        // The container owns the entrance (slides up); the sheet's own mount
        // animation settles downward into the snap point and fights it.
        animateOnMount={false}
        handleIndicatorStyle={styles.handle(theme)}
        backgroundStyle={styles.backgroundStyle(theme)}
        style={isLargeScreen && { marginRight: SHEET_SHADOW_GUTTER }}
      >
        <AnimatedIndexContext.Provider value={animatedIndexShared}>
          {children}
        </AnimatedIndexContext.Provider>
      </BottomSheet>
    </AnimatedContainer>
  );
};

/**
 * The card's two states, cross-faded as the sheet is dragged: the docked bar
 * and the full-screen content. Must be rendered inside a FloatingSheetCard.
 */
export const FloatingSheetPanes: FC<{
  compactStyle: StyleProp<ViewStyle>;
  compact: ReactNode;
  /** Called only while expanded, so the content mounts on demand. */
  renderExpanded: () => ReactNode;
  onExpandedChange?: (isExpanded: boolean) => void;
}> = ({ compactStyle, compact, renderExpanded, onExpandedChange }) => {
  const { animatedIndex, animatedPosition } = useBottomSheet();
  const animatedIndexShared = useContext(AnimatedIndexContext);
  const safeAreaInsets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  const { height: screenHeight } = useWindowDimensions();

  const onExpandedChangeRef = useRef(onExpandedChange);
  onExpandedChangeRef.current = onExpandedChange;
  useEffect(() => {
    onExpandedChangeRef.current?.(isExpanded);
  }, [isExpanded]);

  useAnimatedReaction(
    () => animatedIndex.value,
    (currentValue) => {
      if (animatedIndexShared) animatedIndexShared.value = currentValue;
    },
    [animatedIndex, animatedIndexShared],
  );

  useAnimatedReaction(
    () => animatedPosition.value,
    (currentValue) => {
      runOnJS(setIsExpanded)(currentValue < screenHeight / 1.4);
    },
    [animatedPosition, screenHeight],
  );

  const compactContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedIndex.value, [0, 0.3, 0.7, 1], [1, 1, 0, 0]),
    transform: [
      { scale: interpolate(animatedIndex.value, [0, 0.7, 1], [1, 1, 0.95]) },
    ],
  }));

  const expandedContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedIndex.value, [0, 0.3, 0.7, 1], [0, 0, 1, 1]),
    transform: [
      { scale: interpolate(animatedIndex.value, [0, 0.3, 1], [0.95, 1, 1]) },
    ],
  }));

  return (
    <BottomSheetView style={styles.content}>
      <Animated.View
        style={[compactStyle, compactContentStyle]}
        pointerEvents={isExpanded ? "none" : "auto"}
      >
        {compact}
      </Animated.View>

      {isExpanded && (
        <Animated.View
          style={[
            styles.expandedContent,
            // Fully expanded the sheet reaches the very top of the screen: pad
            // the content below the status bar, discounting the handle area
            // that already sits above it so the app bar hugs the safe area.
            {
              paddingTop: Math.max(0, safeAreaInsets.top - SHEET_HANDLE_HEIGHT),
            },
            expandedContentStyle,
          ]}
          pointerEvents="auto"
        >
          {renderExpanded()}
        </Animated.View>
      )}
    </BottomSheetView>
  );
};

const AnimatedContainer: FC<{
  screenType: string;
  bottomInset: number;
  isLargeScreen: boolean;
  /** Full screen height, even when the sheet stops short: @gorhom clips at
   * this box, so the strip above the sheet is where its top shadow lands. */
  containerHeight: number;
  animatedIndexShared: SharedValue<number>;
  /** Slides the whole card up from under the bottom edge on mount. */
  mountOffset: SharedValue<number>;
  /** Fades the card out while it collapses away. */
  exitOpacity: SharedValue<number>;
  children: ReactNode;
}> = ({
  screenType,
  bottomInset,
  isLargeScreen,
  containerHeight,
  animatedIndexShared,
  mountOffset,
  exitOpacity,
  children,
}) => {
  const containerAnimatedStyle = useAnimatedStyle(() => {
    if (screenType !== "main") {
      return {
        opacity: exitOpacity.value,
        transform: [{ translateY: mountOffset.value }],
      };
    }
    const collapsedBottom = isLargeScreen ? 0 : NAVBAR_HEIGHT + bottomInset;
    // Fully expanded the sheet covers the whole screen, so no lift.
    const bottom = interpolate(
      animatedIndexShared.value,
      [0, 1],
      [collapsedBottom, 0],
    );

    return {
      opacity: exitOpacity.value,
      transform: [{ translateY: -Math.max(0, bottom) + mountOffset.value }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { height: containerHeight },
        isLargeScreen && {
          maxWidth: SHEET_MAX_WIDTH + SHEET_SHADOW_GUTTER,
        },
        containerAnimatedStyle,
      ]}
      pointerEvents="box-none"
    >
      {children}
    </Animated.View>
  );
};

const styles = createStyles({
  container: {
    position: "absolute",
    right: 0,
    left: 0,
    bottom: 0,
  },
  backgroundStyle: (theme) => ({
    backgroundColor: theme.colors.layerDefault,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // Dark: the shadow vanishes against the page, so a top rim marks the edge.
    ...(theme.name === "dark" && {
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderStaticSubtle,
    }),
    elevation: 10,
    shadowColor: GLOBAL.black,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    // React Native Web drops the shadow* props, so the expanded sheet needs
    // its own boxShadow to lift off the page showing behind it.
    ...Platform.select({
      web: {
        boxShadow: `0px -2px 24px ${withAlpha(GLOBAL.black, 0.18)}`,
      },
    }),
  }),
  handle: (theme) => ({
    backgroundColor: theme.colors.textDisabled,
  }),
  content: {
    height: "100%",
  },
  expandedContent: {
    flex: 1,
    paddingBottom: 16,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
