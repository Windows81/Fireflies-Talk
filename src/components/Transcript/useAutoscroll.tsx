import type { FlashListRef } from "@shopify/flash-list";
import type { FC, MutableRefObject, PropsWithChildren, RefObject } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { LogBox, Platform } from "react-native";
import { TranscriptContext } from "./TranscriptContext";
import type { CaptionIndexToGroupCaptionIndex, GroupedCaption } from "./types";

LogBox.ignoreLogs(["returned an invalid measurement response"]);

type AutoScrollType = "audio" | "bottom";

const AutoscrollContext = createContext(
  {} as {
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
    scrollToCurrentCaption: (index?: number) => void;
    scrollToBottom: () => void;
    scrollToBottomImmediate: () => void;
    onScrollBeginDrag: () => void;
    type: AutoScrollType;
    isProgrammaticScrolling: boolean;
    setIsProgrammaticScrolling: (value: boolean) => void;
    setListHeight: (height: number) => void;
    setContentHeight: (height: number) => void;
  },
);

export const AutoscrollProvider: FC<
  PropsWithChildren<{
    listRef: RefObject<FlashListRef<GroupedCaption> | null>;
    type: AutoScrollType;
    captionIndexToGroupCaptionIndexRef?: MutableRefObject<CaptionIndexToGroupCaptionIndex>;
  }>
> = ({ children, listRef, captionIndexToGroupCaptionIndexRef, type }) => {
  const { currentIndex } = useContext(TranscriptContext);

  const [enabled, setEnabled] = useState(true);
  const [isProgrammaticScrolling, setIsProgrammaticScrolling] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const listHeightRef = useRef(0);
  const contentHeightRef = useRef(0);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const scrollToCurrentCaption = useCallback(
    (captionIndex?: number) => {
      if (captionIndex == null || !captionIndexToGroupCaptionIndexRef?.current)
        return;
      const listItemIndex =
        captionIndexToGroupCaptionIndexRef?.current.findIndex(
          (groupCaptionIndex) => groupCaptionIndex > captionIndex,
        ) - 1;
      if (listItemIndex >= 0) {
        setIsProgrammaticScrolling(true);
        listRef.current?.scrollToIndex({
          index: listItemIndex || 0,
          animated: true,
        });
        // Reset after scroll animation settles
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setIsProgrammaticScrolling(false);
          timeoutRef.current = null;
        }, 350);
      }
    },
    [captionIndexToGroupCaptionIndexRef, listRef],
  );

  const setListHeight = useCallback((height: number) => {
    listHeightRef.current = height;
  }, []);

  const setContentHeight = useCallback((height: number) => {
    contentHeightRef.current = height;
  }, []);

  const getBottomOffset = useCallback(() => {
    const listHeight = listHeightRef.current;
    const contentHeight = contentHeightRef.current;
    if (listHeight <= 0 || contentHeight <= 0) return null;
    return Math.max(0, contentHeight - listHeight);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (!listRef.current) return;
    // Cancel any pending timeout to avoid race
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Mark programmatic scroll so UI logic can ignore transient onScroll states
    setIsProgrammaticScrolling(true);
    const offset = getBottomOffset();
    if (offset === null) {
      listRef.current.scrollToEnd({ animated: true });
    } else {
      listRef.current.scrollToOffset({ offset, animated: true });
    }
    if (Platform.OS !== "web") {
      timeoutRef.current = setTimeout(() => {
        setIsProgrammaticScrolling(false);
        timeoutRef.current = null;
      }, 350);
    }
  }, [getBottomOffset, listRef]);

  const scrollToBottomImmediate = useCallback(() => {
    if (!listRef.current) return;
    // Cancel any pending timeout to avoid race
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsProgrammaticScrolling(true);
    const offset = getBottomOffset();
    if (offset === null) {
      listRef.current.scrollToEnd({ animated: false });
    } else {
      listRef.current.scrollToOffset({ offset, animated: false });
    }
    if (Platform.OS !== "web") {
      // Defer reset to next tick to avoid interfering with scroll event
      timeoutRef.current = setTimeout(() => {
        setIsProgrammaticScrolling(false);
        timeoutRef.current = null;
      }, 0);
    }
  }, [listRef, getBottomOffset]);

  const currentIndexRef = useRef(currentIndex);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
    if (enabled && type === "audio") {
      scrollToCurrentCaption(currentIndex);
    }
  }, [currentIndex, enabled, scrollToCurrentCaption, type]);

  const onScrollBeginDrag = useCallback(() => {
    setEnabled(false);
  }, []);

  return (
    <AutoscrollContext.Provider
      value={{
        enabled,
        setEnabled,
        scrollToCurrentCaption,
        scrollToBottom,
        scrollToBottomImmediate,
        onScrollBeginDrag,
        type,
        isProgrammaticScrolling,
        setIsProgrammaticScrolling,
        setListHeight,
        setContentHeight,
      }}
    >
      {children}
    </AutoscrollContext.Provider>
  );
};

export const useAutoscroll = () => {
  return useContext(AutoscrollContext);
};
