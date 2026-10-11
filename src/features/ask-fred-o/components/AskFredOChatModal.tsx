import { Dialog } from "@/components/Dialog";
import { Breakpoint, createStyles, useTheme } from "@/styles";
import type { FC, PropsWithChildren } from "react";
import { useEffect } from "react";
import { useWindowDimensions } from "react-native";
import Animated, {
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsAskFredOEnabled } from "../hooks/useIsAskFredOEnabled";
import { AskFredOProvider } from "../providers/AskFredOProvider";
import { AskFredOChat } from "./AskFredOChat";

// Gap between the status bar and the top of the sheet.
const SHEET_TOP_GAP = 8;

// Slides in with a transform, not an `entering` animation: that one pins the
// first layout, so Android's bottom safe-area padding (a frame later) is lost.
const SheetSurface: FC<PropsWithChildren> = ({ children }) => {
  const { height } = useWindowDimensions();
  const offset = useSharedValue(height);

  useEffect(() => {
    offset.value = withTiming(0, { duration: 260 });
  }, [offset]);

  const slideInStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <Animated.View
      style={[styles.surface, slideInStyle]}
      exiting={SlideOutDown.duration(200)}
    >
      {children}
    </Animated.View>
  );
};

export const AskFredOChatModal: FC<{
  isOpen: boolean;
  close: () => void;
}> = ({ isOpen, close }) => {
  const isEnabled = useIsAskFredOEnabled();
  const { top } = useSafeAreaInsets();
  // Dialog renders a centered dialog from the Medium breakpoint up.
  const isBottomSheet = useTheme().breakpoint < Breakpoint.Medium;
  const sheetTop = top + SHEET_TOP_GAP;

  if (!isEnabled) return null;

  return (
    <AskFredOProvider isOpen={isOpen}>
      <Dialog.Root
        isOpen={isOpen}
        close={close}
        variant="bottomSheet"
        style={isBottomSheet && [styles.sheet, { marginTop: sheetTop }]}
        // iOS: the sheet stays full height behind the keyboard, which then
        // shows the sheet (not the backdrop) around its rounded corners.
        avoidKeyboard={!isBottomSheet}
      >
        <SheetSurface>
          <AskFredOChat
            close={close}
            keyboardVerticalOffset={isBottomSheet ? sheetTop : 0}
          />
        </SheetSurface>
      </Dialog.Root>
    </AskFredOProvider>
  );
};

const styles = createStyles({
  // Reaches just under the status bar; the top margin keeps it there while the
  // keyboard shrinks it.
  sheet: {
    maxHeight: "100%",
  },
  surface: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
});
