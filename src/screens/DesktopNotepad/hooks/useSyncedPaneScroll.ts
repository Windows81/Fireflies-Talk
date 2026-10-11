import { useEffect, useRef } from "react";
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from "react-native";
import { useDesktopNotepadContext } from "../DesktopNotepadContext";

// Keeps the Notes and Tasks panes scrolled to the same offset: each pane
// reports its scroll position while active, and restores the shared
// position when it becomes active again (e.g. after switching tabs).
export const useSyncedPaneScroll = (active: boolean) => {
  const { paneScrollY, setPaneScrollY } = useDesktopNotepadContext();
  const scrollRef = useRef<ScrollView>(null);
  // A shorter pane's restore scrollTo clamps to its own max scroll extent, and
  // that clamped value echoes back through onScroll a frame later. Without
  // this guard, the echo would overwrite paneScrollY with the smaller value,
  // so switching back to a taller pane would restore to the wrong position.
  const isRestoringRef = useRef(false);

  useEffect(() => {
    if (active) {
      isRestoringRef.current = true;
      scrollRef.current?.scrollTo({ y: paneScrollY, animated: false });
      requestAnimationFrame(() => {
        isRestoringRef.current = false;
      });
    }
    // Only re-run when this pane becomes active, not on every scroll update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (active && !isRestoringRef.current) {
      setPaneScrollY(event.nativeEvent.contentOffset.y);
    }
  };

  return { scrollRef, onScroll };
};
