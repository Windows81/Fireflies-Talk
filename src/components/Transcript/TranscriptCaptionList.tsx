import { IconChevronDown, IconChevronUp } from "@/assets/svg";
import { Button } from "@/components/Button";
import type { Caption } from "@/features/transcript";
import { useTheme } from "@/styles";
import { toHHMMSS, toHourMinuteSecond } from "@/utils/time";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import type { FC, RefObject } from "react";
import {
  Fragment,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
  ViewToken,
} from "react-native";
import {
  InteractionManager,
  Platform,
  Pressable,
  Text as RNText,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { Avatar } from "../Avatar";
import { SkeletonLoading } from "../Loading";
import { Text } from "../Typography";
import { TranscriptContext } from "./TranscriptContext";
import { TranscriptPausedDivider } from "./TranscriptPausedDivider";
import type {
  CaptionIndexToGroupCaptionIndex,
  GroupedCaption,
  TranscriptSeparator,
} from "./types";
import { AutoscrollProvider, useAutoscroll } from "./useAutoscroll";
import { decorateGroupsWithSeparators, mergeCaptions } from "./utils";
import { isDesktop } from "@/utils/device";

const MAX_SENTENCES = 4;
const MAX_WORDS = 150;
const AnimatedText = Animated.createAnimatedComponent(Text);
const UNASSIGNED_SPEAKER_KEY = "unassigned";
const UNASSIGNED_SPEAKER_LABEL = "Unassigned";

// Auto-scroll behavior thresholds
const RAPID_UPDATE_WINDOW_MS = 600;
const RAPID_UPDATE_THRESHOLD = 2;
const IGNORE_SIGNIFICANT_SHRINK_PX = -50;
const IGNORE_NEGLIGIBLE_GROWTH_PX = 5;
const FALLBACK_RESET_DELAY_RAPID_MS = 50;
const FALLBACK_RESET_DELAY_NORMAL_MS = 350;
const NEAR_BOTTOM_THRESHOLD_PX = 100;
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 50 };

const CaptionSentence: FC<{
  caption: Caption;
}> = ({ caption }) => {
  const {
    onCaptionClick,
    marks,
    currentIndex,
    activeCaptionIndex,
    activeMatchOccurrence,
  } = useContext(TranscriptContext);

  const isCurrent = caption.index === currentIndex;

  const onClick = onCaptionClick ? () => onCaptionClick(caption) : undefined;

  const theme = useTheme();

  // Highlight search query text in caption
  const textEl = useMemo(() => {
    const mark = marks?.[caption.index];
    if (!mark) return caption.text;

    const elements = [];
    let index = 0;
    let lastIndex = 0;
    let occurrence = 0;
    const captionText = caption.text.toLowerCase();
    while (index !== -1) {
      let length: number;
      [length, index] = mark.reduce(
        (acc, match) => {
          const matchIndex = captionText.indexOf(
            match.word.toLowerCase(),
            lastIndex,
          );
          if (matchIndex === -1) return acc;
          const next = [match.word.length, matchIndex] as [
            length: number,
            index: number,
          ];
          if (acc[1] === -1) return next;
          // find the nearest match among all matches
          if (matchIndex < acc[1]) return next;
          return acc;
        },
        [0, -1] as [length: number, index: number],
      );

      if (index !== -1) {
        if (index > lastIndex) {
          elements.push(caption.text.substring(lastIndex, index));
        }
        const isActiveMatch =
          caption.index === activeCaptionIndex &&
          occurrence === activeMatchOccurrence;
        occurrence += 1;
        elements.push(
          <RNText
            style={
              isActiveMatch
                ? {
                    backgroundColor:
                      theme.colors.informationInteractiveBlueDefault,
                    color: theme.colors.textContrast,
                  }
                : mark[0].color
                  ? {
                      backgroundColor:
                        theme.colors[`rainbowStatic${mark[0].color}Subtle`],
                      color: theme.colors[`rainbowStatic${mark[0].color}Text`],
                    }
                  : isDesktop
                    ? {
                        backgroundColor:
                          theme.colors.informationStaticBlueSubtle,
                        color: theme.colors.informationStaticBlueText,
                      }
                    : {
                        backgroundColor: theme.colors.rainbowStaticPurpleSubtle,
                        color: theme.colors.rainbowStaticPurpleText,
                      }
            }
            key={index}
          >
            {caption.text.substring(index, index + length)}
          </RNText>,
        );
        lastIndex = index + length;
      }
    }
    if (lastIndex < caption.text.length) {
      elements.push(caption.text.substring(lastIndex));
    }
    return elements;
  }, [caption, marks, theme, activeCaptionIndex, activeMatchOccurrence]);

  const [isPressed, setIsPressed] = useState(false);

  return (
    <Text
      variant="body1LongRegular"
      color="textSecondary"
      style={[
        isCurrent && {
          backgroundColor: theme.colors.rainbowStaticPinkSubtle,
          color: theme.colors.rainbowStaticPinkText,
        },
        isPressed && {
          backgroundColor: theme.colors.rainbowStaticPurpleSubtle,
        },
      ]}
      onPress={onClick}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
    >
      {textEl}
    </Text>
  );
};

const TranscriptCaptionListItem = memo<{
  groupedCaption: GroupedCaption;
}>(function TranscriptCaptionListItem({ groupedCaption }) {
  const { onCaptionClick, onCaptionSpeakerClick } =
    useContext(TranscriptContext);

  const theme = useTheme();
  const isUnassignedSpeaker =
    groupedCaption.speakerId.toLowerCase() === UNASSIGNED_SPEAKER_KEY ||
    groupedCaption.speakerName.toLowerCase() === UNASSIGNED_SPEAKER_KEY;
  const speakerLabel = isUnassignedSpeaker
    ? UNASSIGNED_SPEAKER_LABEL
    : groupedCaption.speakerName;
  const transcriptParagraphStyle = [
    styles.transcriptParagraph,
    isUnassignedSpeaker && styles.transcriptParagraphUnassigned,
  ];

  return (
    <View
      style={styles.item}
      aria-label={`${
        isUnassignedSpeaker ? "" : `${speakerLabel} `
      }${toHourMinuteSecond(groupedCaption.startTime)} ${groupedCaption.text}`}
      role="listitem"
    >
      {groupedCaption.separatorsBefore?.map((separator) => (
        <TranscriptPausedDivider key={separator.id} separator={separator} />
      ))}
      {isUnassignedSpeaker ? (
        <View style={styles.itemHeaderUnassigned}>
          <Text
            variant="body2Regular"
            color={
              isDesktop
                ? "informationInteractiveBlueDefault"
                : "informationStaticBlueText"
            }
            style={styles.timestamp}
          >
            {toHHMMSS(groupedCaption.startTime)}
          </Text>
        </View>
      ) : (
        <View style={styles.itemHeader}>
          <TouchableOpacity
            onPress={() => onCaptionSpeakerClick?.(groupedCaption)}
            disabled={!onCaptionSpeakerClick}
            style={styles.speaker}
          >
            <View style={styles.speakerInfo}>
              <Avatar name={speakerLabel} size={20} shape="square" />
              <Text variant="label2Weight" color="textSecondary">
                {speakerLabel}
              </Text>
            </View>
            {onCaptionSpeakerClick && (
              <IconChevronDown
                width={16}
                height={16}
                color={theme.colors.textSecondary}
              />
            )}
          </TouchableOpacity>
          <Text color="textHint" variant="body2Regular" fontSize={8}>
            •
          </Text>
          <Text
            variant="body2Regular"
            color={
              isDesktop
                ? "informationInteractiveBlueDefault"
                : "informationStaticBlueText"
            }
            onPress={
              onCaptionClick
                ? () => onCaptionClick(groupedCaption.captions[0])
                : undefined
            }
            style={styles.timestamp}
          >
            {toHHMMSS(groupedCaption.startTime)}
          </Text>
        </View>
      )}
      <AnimatedText style={transcriptParagraphStyle}>
        {groupedCaption.captions.map((caption) => (
          <Fragment key={caption.index}>
            <CaptionSentence caption={caption} />{" "}
          </Fragment>
        ))}
      </AnimatedText>
      {groupedCaption.separatorsAfter?.map((separator) => (
        <TranscriptPausedDivider key={separator.id} separator={separator} />
      ))}
    </View>
  );
});

const renderItem = ({ item }: { item: GroupedCaption }) => (
  <TranscriptCaptionListItem groupedCaption={item} />
);

const SyncScrollButton: FC<{
  label: string;
  up?: boolean;
  onPress: () => void;
}> = ({ label, up, onPress }) => {
  const theme = useTheme();
  const Chevron = up ? IconChevronUp : IconChevronDown;

  if (!isDesktop) {
    return (
      <Button style={styles.syncListPanel} onPress={onPress} variant="outlined">
        {label}
      </Button>
    );
  }

  return (
    <Pressable
      style={[
        styles.syncDesktop,
        {
          backgroundColor: theme.colors.interactiveNeutral1Default,
          borderColor: theme.colors.borderInteractiveDefault,
        },
      ]}
      onPress={onPress}
      role="button"
    >
      <Chevron
        width={20}
        height={20}
        color={theme.colors.commandNeutralDefault}
      />
      <Text variant="label2Weight" color="commandNeutralDefault">
        {label}
      </Text>
    </Pressable>
  );
};

const ItemSeparatorComponent: FC = () => <View style={styles.sep} />;

export const TranscriptCaptionListInner: FC<{
  listRef: RefObject<FlashListRef<GroupedCaption> | null>;
  groupedCaptions: GroupedCaption[];
  listContentStyle?: StyleProp<ViewStyle>;
}> = ({ listRef, groupedCaptions, listContentStyle }) => {
  const { currentIndex, player, activeCaptionIndex, scrollToCaption } =
    useContext(TranscriptContext);

  const {
    onScrollBeginDrag,
    enabled: autoScrollEnabled,
    setEnabled,
    scrollToCurrentCaption,
    scrollToBottom,
    scrollToBottomImmediate,
    type: autoScrollType,
    isProgrammaticScrolling,
    setIsProgrammaticScrolling,
    setListHeight,
    setContentHeight,
  } = useAutoscroll();

  // Reveal the active search match, pausing audio-sync autoscroll so the two
  // don't fight over the scroll position.
  useEffect(() => {
    if (activeCaptionIndex == null) return;
    setEnabled(false);
    scrollToCurrentCaption(activeCaptionIndex);
  }, [activeCaptionIndex, scrollToCurrentCaption, setEnabled]);

  // On-demand scroll (e.g. a summary timestamp click). Waits for the grouped
  // captions so it still lands when the transcript tab mounts on the click.
  const lastScrollNonceRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!scrollToCaption || groupedCaptions.length === 0) return;
    if (scrollToCaption.nonce === lastScrollNonceRef.current) return;
    lastScrollNonceRef.current = scrollToCaption.nonce;
    setEnabled(true);
    scrollToCurrentCaption(scrollToCaption.captionIndex);
  }, [scrollToCaption, groupedCaptions, scrollToCurrentCaption, setEnabled]);

  // Web onScroll only drives the live ("bottom") mode (disable on upward
  // scroll, re-enable at bottom). Audio sync is disabled by the wheel listener
  // and only re-enabled on end-reached when the playhead is already visible.
  const handleScrollEvent = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (autoScrollType !== "bottom") return;

      const { layoutMeasurement, contentOffset, contentSize } =
        event.nativeEvent;
      const isAtBottom =
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - NEAR_BOTTOM_THRESHOLD_PX;

      if (isProgrammaticScrolling) {
        if (isAtBottom) {
          setIsProgrammaticScrolling(false);
          if (!autoScrollEnabled) setEnabled(true);
        }
        return;
      }

      if (isAtBottom) {
        if (!autoScrollEnabled) setEnabled(true);
      } else if (autoScrollEnabled) {
        setEnabled(false);
      }
    },
    [
      autoScrollEnabled,
      setEnabled,
      autoScrollType,
      isProgrammaticScrolling,
      setIsProgrammaticScrolling,
    ],
  );

  // Audio sync: a real user wheel/trackpad scroll (never a programmatic one)
  // disables follow mode. Mirrors dashboard-ff's wheel-based detection.
  const wrapperRef = useRef<View>(null);
  useEffect(() => {
    if (Platform.OS !== "web" || autoScrollType !== "audio") return;
    const node = wrapperRef.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) return;
    const handleWheel = () => setEnabled(false);
    node.addEventListener("wheel", handleWheel, { passive: true });
    return () => node.removeEventListener("wheel", handleWheel);
  }, [autoScrollType, setEnabled]);

  // Track whether the active (playing) caption is on screen. The audio sync
  // button only appears once the user has scrolled the playhead out of view —
  // i.e. it stays hidden while the transcript is in sync with the audio.
  const groupedCaptionsRef = useRef(groupedCaptions);
  groupedCaptionsRef.current = groupedCaptions;
  const currentIndexRef = useRef(currentIndex);
  const lastViewablesRef = useRef<ViewToken[]>([]);
  const [activeCaptionVisible, setActiveCaptionVisible] = useState(true);
  // Whether the playing caption sits above the viewport — drives the sync
  // button's chevron direction (up to scroll back up, down to scroll down).
  const [activeAbove, setActiveAbove] = useState(false);

  const recomputeActiveVisible = useCallback(() => {
    if (autoScrollType !== "audio") return;
    const captionIndex = currentIndexRef.current;
    if (captionIndex == null) {
      setActiveCaptionVisible(true);
      return;
    }
    const groups = groupedCaptionsRef.current;
    const isActiveGroup = (arrayIndex: number) => {
      const group = groups[arrayIndex];
      if (!group) return false;
      const next = groups[arrayIndex + 1];
      return (
        group.index <= captionIndex && (!next || next.index > captionIndex)
      );
    };

    const visibleIndexes = lastViewablesRef.current
      .map((token) => token.index)
      .filter((index): index is number => index != null);
    const visible = visibleIndexes.some(isActiveGroup);
    setActiveCaptionVisible(visible);

    if (!visible && visibleIndexes.length) {
      const activeArrayIndex = groups.findIndex((_, i) => isActiveGroup(i));
      setActiveAbove(activeArrayIndex < Math.min(...visibleIndexes));
    }
  }, [autoScrollType]);

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      lastViewablesRef.current = viewableItems;
      recomputeActiveVisible();
    },
  ).current;

  useEffect(() => {
    currentIndexRef.current = currentIndex;
    recomputeActiveVisible();
  }, [currentIndex, recomputeActiveVisible]);

  const scrollToCurrentIndex = useCallback(() => {
    scrollToCurrentCaption(currentIndex);
    setEnabled(true);
  }, [currentIndex, scrollToCurrentCaption, setEnabled]);

  const handleScrollEndReached = useCallback(() => {
    if (autoScrollType === "bottom") {
      if (!autoScrollEnabled) setEnabled(true);
      scrollToBottom();
      return;
    }

    // Audio mode: only re-engage follow when the playhead is already on screen.
    // Hitting the list end alone must not re-enable — that would yank a recorded
    // notepad transcript back up to an earlier playhead.
    if (!autoScrollEnabled && activeCaptionVisible) {
      setEnabled(true);
    }
  }, [
    autoScrollEnabled,
    setEnabled,
    scrollToBottom,
    autoScrollType,
    activeCaptionVisible,
  ]);

  const autoScrollCancelRef = useRef<(() => void) | undefined>(undefined);
  const didInitialJumpRef = useRef(false);
  const lastContentSizeRef = useRef(0);
  const rapidUpdateCountRef = useRef(0);
  const lastUpdateTimeRef = useRef(0);

  const onContentSizeChange = useCallback(
    (_width: number, height: number) => {
      setContentHeight(height);
      if (!autoScrollEnabled || autoScrollType !== "bottom") return;

      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = now;

      if (timeSinceLastUpdate < RAPID_UPDATE_WINDOW_MS) {
        rapidUpdateCountRef.current++;
      } else {
        rapidUpdateCountRef.current = 0;
      }

      const isRapidlyUpdating =
        rapidUpdateCountRef.current > RAPID_UPDATE_THRESHOLD;

      const previousHeight = lastContentSizeRef.current;
      const heightDiff = height - previousHeight;
      lastContentSizeRef.current = height;

      if (heightDiff < IGNORE_SIGNIFICANT_SHRINK_PX) return;
      if (heightDiff < IGNORE_NEGLIGIBLE_GROWTH_PX) return;

      autoScrollCancelRef.current?.();
      const { cancel } = InteractionManager.runAfterInteractions(() => {
        autoScrollCancelRef.current = undefined;
        if (!didInitialJumpRef.current) {
          didInitialJumpRef.current = true;
          scrollToBottomImmediate();
        } else if (isRapidlyUpdating) {
          scrollToBottomImmediate();
        } else {
          scrollToBottom();
        }
        setTimeout(
          () => {
            setIsProgrammaticScrolling(false);
            setEnabled(true);
          },
          isRapidlyUpdating
            ? FALLBACK_RESET_DELAY_RAPID_MS
            : FALLBACK_RESET_DELAY_NORMAL_MS,
        );
      });
      autoScrollCancelRef.current = cancel;
    },
    [
      autoScrollEnabled,
      scrollToBottom,
      scrollToBottomImmediate,
      autoScrollType,
      setIsProgrammaticScrolling,
      setEnabled,
      setContentHeight,
    ],
  );

  const handleListLayout = useCallback(
    (event: LayoutChangeEvent) => {
      setListHeight(event.nativeEvent.layout.height);
    },
    [setListHeight],
  );

  const showScrollButton = useMemo(() => {
    // Live mode hides the button during programmatic scroll-to-bottom. Audio
    // sync shows the button only when disabled AND the playing caption is off
    // screen, so it disappears once the transcript is back in sync.
    if (autoScrollType === "bottom") {
      return !isProgrammaticScrolling && !autoScrollEnabled;
    }
    return !!player && !autoScrollEnabled && !activeCaptionVisible;
  }, [
    autoScrollEnabled,
    player,
    autoScrollType,
    isProgrammaticScrolling,
    activeCaptionVisible,
  ]);

  return (
    <>
      <View ref={wrapperRef} style={styles.listWrapper}>
        <FlashList
          ref={listRef}
          contentContainerStyle={
            listContentStyle
              ? StyleSheet.flatten([styles.listContent, listContentStyle])
              : styles.listContent
          }
          data={groupedCaptions}
          keyExtractor={(item) => `${item.index}-${item.startTime}`}
          renderItem={renderItem}
          onScrollBeginDrag={
            Platform.OS !== "web" ? onScrollBeginDrag : undefined
          }
          onScroll={Platform.OS === "web" ? handleScrollEvent : undefined}
          scrollEventThrottle={Platform.OS === "web" ? 16 : undefined}
          onViewableItemsChanged={
            autoScrollType === "audio" ? handleViewableItemsChanged : undefined
          }
          viewabilityConfig={VIEWABILITY_CONFIG}
          onEndReached={handleScrollEndReached}
          onEndReachedThreshold={0.001}
          onContentSizeChange={onContentSizeChange}
          onLayout={handleListLayout}
          ItemSeparatorComponent={ItemSeparatorComponent}
          role="list"
        />
      </View>
      {showScrollButton && (
        <View style={styles.syncListContainer}>
          <SyncScrollButton
            label={
              autoScrollType === "bottom"
                ? "Scroll to bottom"
                : "Sync With Audio"
            }
            up={autoScrollType === "audio" && activeAbove}
            onPress={() => {
              if (autoScrollType === "bottom") {
                setEnabled(true);
                scrollToBottom();
              } else {
                scrollToCurrentIndex();
              }
            }}
          />
        </View>
      )}
    </>
  );
};

export const TranscriptCaptionList: FC<{
  captions: Caption[];
  listContentStyle?: StyleProp<ViewStyle>;
  separators?: TranscriptSeparator[];
}> = ({ captions, listContentStyle, separators }) => {
  const ref = useRef<FlashListRef<GroupedCaption> | null>(null);

  const { includedIndexes } = useContext(TranscriptContext);
  const [groupedCaptions, setGroupedCaptions] = useState<GroupedCaption[]>([]);

  const decoratedCaptions = useMemo(
    () => decorateGroupsWithSeparators(groupedCaptions, separators),
    [groupedCaptions, separators],
  );

  const captionIndexToGroupCaptionIndexRef =
    useRef<CaptionIndexToGroupCaptionIndex>([]);

  /**
   * Merge captions that are close together in time
   * and have the same speaker.
   */
  useEffect(() => {
    const interaction = InteractionManager.runAfterInteractions(() => {
      mergeCaptions(
        captions,
        includedIndexes,
        MAX_SENTENCES,
        MAX_WORDS,
        (merged, captionIndexToGroupCaptionIndex) => {
          setGroupedCaptions(merged);
          captionIndexToGroupCaptionIndexRef.current =
            captionIndexToGroupCaptionIndex;
        },
      );
    });
    return () => interaction.cancel();
  }, [captions, includedIndexes]);

  return (
    <View style={styles.root}>
      <AutoscrollProvider
        listRef={ref}
        captionIndexToGroupCaptionIndexRef={captionIndexToGroupCaptionIndexRef}
        type={"audio"}
      >
        <TranscriptCaptionListInner
          listRef={ref}
          groupedCaptions={decoratedCaptions}
          listContentStyle={listContentStyle}
        />
      </AutoscrollProvider>
    </View>
  );
};

const LoadingTranscriptCaptionListItem: FC = () => {
  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <View style={styles.speaker}>
          <View style={styles.speakerInfo}>
            <SkeletonLoading width={20} height={20} />
            <SkeletonLoading width={80} height={20} />
          </View>
        </View>
        <Text color="textHint" variant="body2Regular" fontSize={8}>
          •
        </Text>
        <SkeletonLoading width={40} height={20} />
      </View>
      <View style={styles.transcriptParagraph}>
        <SkeletonLoading width="100%" height={60} />
      </View>
    </View>
  );
};

const LOADING_DATA = Array.from({ length: 10 });
const renderLoadingItem = () => <LoadingTranscriptCaptionListItem />;

export const LoadingTranscriptCaptionList: FC = () => {
  return (
    <View style={styles.root}>
      <FlashList
        contentContainerStyle={styles.listContent}
        data={LOADING_DATA}
        renderItem={renderLoadingItem}
        ItemSeparatorComponent={ItemSeparatorComponent}
        role="list"
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: "relative",
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  listWrapper: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  item: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    width: "100%",
    paddingRight: 4,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemHeaderUnassigned: {
    flexDirection: "row",
    alignItems: "center",
  },
  speaker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  speakerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timestamp: {
    textDecorationLine: isDesktop ? undefined : "underline",
  },
  transcriptParagraph: {
    paddingLeft: isDesktop ? 36 : 32,
    width: "100%",
  },
  transcriptParagraphUnassigned: {
    paddingLeft: 0,
  },
  // Hugs the foot of the transcript viewport. A larger inset reads fine in the
  // full panel but floats over the text in the compact one, which is only a
  // few lines tall.
  syncListContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 10,
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  syncListPanel: {
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontWeight: "bold",
    color: "black",
  },
  syncDesktop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 36,
    paddingLeft: 12,
    paddingRight: 16,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    shadowColor: "#101828",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
  },
  sep: {
    height: isDesktop ? 16 : 20,
  },
});
