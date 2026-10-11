import { IconCopy, IconSearch, IconX } from "@/assets/svg";
import { TextInput } from "@/components/Input";
import { toast } from "@/components/Toast";
import { copyAsText } from "@/utils/clipboard";
import { createStyles, useTheme } from "@/styles";
import {
  useCallback,
  useEffect,
  useState,
  useRef,
  type FC,
  type RefObject,
} from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, type View } from "react-native";
import Animated, {
  FadeIn,
  SlideInDown,
  SlideOutUp,
} from "react-native-reanimated";
import { useTranscriptSearch } from "../Context/TranscriptSearchContext";
import { useLiveScreenContext } from "../Context/LiveScreenContext";
import { TabName } from "@/features/live";
import { Button } from "@/components/Button";
import { isDesktop } from "@/utils/device";

export interface CopyAndSearchActionProps {
  currentTab: string;
  contentToCopy?: string;
  topMargin?: number;
  containerRef?: RefObject<View | null>;
  containerStyle?: StyleProp<ViewStyle>;
  showSearch?: boolean;
}

export const CopyAndSearchAction: FC<CopyAndSearchActionProps> = ({
  currentTab,
  contentToCopy,
  topMargin = 64,
  containerRef,
  containerStyle,
  showSearch = true,
}) => {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState("");
  const { liveTranscript, formattedChapters } = useLiveScreenContext();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    searchText,
    setSearchText,
    clearSearch,
    isSearchActive,
    setIsSearchActive,
  } = useTranscriptSearch();

  useEffect(() => {
    setInputValue(searchText);
  }, [searchText]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!isSearchActive) {
      return;
    }

    if (!inputValue.trim()) {
      setSearchText(
        "",
        liveTranscript?.groupedCaptions?.flatMap((group) => group.captions) ??
          [],
      );
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      const allCaptions =
        liveTranscript?.groupedCaptions?.flatMap((group) => group.captions) ??
        [];
      setSearchText(inputValue.trim(), allCaptions);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue, isSearchActive, liveTranscript, setSearchText]);

  const isAiNotesTab = currentTab === "notes" || currentTab === "ai-notes";

  const handleCopy = useCallback(() => {
    let textToCopy = contentToCopy;

    if (!textToCopy) {
      if (currentTab === "transcript") {
        textToCopy = liveTranscript?.groupedCaptions
          .map((group) => `${group.speakerName}: ${group.text}`)
          .join("\n\n");
      } else if (isAiNotesTab) {
        textToCopy = formattedChapters
          .map(
            (chapter) =>
              `${chapter.emoji} ${chapter.title} ${chapter.timeRangeFormatted}\n${chapter.notes
                .map((note) => `- ${note.note}`)
                .join("\n")}`,
          )
          .join("\n\n");
      }
    }

    if (textToCopy) {
      copyAsText(textToCopy).then(() => {
        if (currentTab === "transcript") {
          toast({ message: "Transcript copied", containerRef });
        } else {
          toast({ message: "Notes copied", containerRef });
        }
      });
    }
  }, [
    contentToCopy,
    currentTab,
    isAiNotesTab,
    liveTranscript?.groupedCaptions,
    formattedChapters,
    containerRef,
  ]);

  const handleToggleSearch = useCallback(() => {
    if (!isSearchActive) {
      setInputValue("");
      setIsSearchActive(true);
    } else {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      clearSearch();
    }
  }, [isSearchActive, setIsSearchActive, clearSearch]);

  const handleCloseOrClear = useCallback(() => {
    if (inputValue.length > 0) {
      // If there's text, just clear it
      setInputValue("");
      setSearchText(
        "",
        liveTranscript?.groupedCaptions?.flatMap((group) => group.captions) ??
          [],
      );
    } else {
      // If empty, close the search bar entirely
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      clearSearch();
    }
  }, [inputValue, setSearchText, liveTranscript, clearSearch]);

  const showCopyButton = isAiNotesTab || currentTab === TabName.Transcript;

  // search button is disabled until we implement a proper UI
  const showSearchButton = showSearch && currentTab === TabName.Transcript;

  if (!showCopyButton && !showSearchButton) {
    return null;
  }

  return (
    <>
      {isSearchActive && showSearch ? (
        <Animated.View
          style={styles.searchContainer(theme)}
          entering={SlideInDown.duration(300)}
          exiting={SlideOutUp.duration(300)}
        >
          <TextInput
            value={inputValue}
            onValueChange={setInputValue}
            placeholder="Search transcript..."
            autoFocus
            returnKeyType="done"
            trailing={
              <Pressable
                accessibilityRole="button"
                onPress={handleCloseOrClear}
                style={styles.clearButton}
              >
                <IconX width={16} height={16} color={theme.colors.textMuted} />
              </Pressable>
            }
          />
        </Animated.View>
      ) : (
        <Animated.View
          style={
            containerStyle
              ? containerStyle
              : [styles.actionContainer(theme), { top: topMargin }]
          }
          entering={FadeIn.duration(300)}
        >
          {showSearchButton && (
            <Button
              nativeID="no-drag"
              variant={isDesktop ? "transparentNeutral" : "secondary"}
              onPress={handleToggleSearch}
              aria-label="Search"
              Icon={IconSearch}
              size={"xs"}
            />
          )}
          {showCopyButton && (
            <Button
              nativeID="no-drag"
              variant={isDesktop ? "transparentNeutral" : "secondary"}
              onPress={handleCopy}
              aria-label="Copy"
              Icon={IconCopy}
              size={"xs"}
            />
          )}
        </Animated.View>
      )}
    </>
  );
};

const styles = createStyles({
  actionContainer: (theme) => ({
    position: "absolute",
    top: 64,
    right: 12,
    flexDirection: "row",
    backgroundColor: theme.colors.pageBackground,
    borderRadius: 8,
    padding: 4,
    zIndex: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
  }),
  searchContainer: (theme) => ({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: theme.colors.layerDefault,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderStaticDefault,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: theme.colors.borderStaticDefault,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }),
  clearButton: {
    padding: 8,
    cursor: "pointer",
  },
});
