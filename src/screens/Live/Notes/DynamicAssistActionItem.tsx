import { Text } from "@/components/Typography";
import { createStyles, vars } from "@/styles";
import type { useTheme } from "@/styles";
import type { FC, ReactNode } from "react";
import { View, Pressable } from "react-native";
import Animated, {
  FadeInLeft,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ASSIST_MODES } from "src/features/live/types";
import { IconChevronDown, IconChevronUp } from "@/assets/svg";
import { useWebHover } from "@/components/Button";
import { useState, useEffect, useRef } from "react";

const parseUserDisplayContent = (query: string): string => {
  const withoutContext = query.replace(
    /\[CONTEXT_START\][\s\S]*?\[CONTEXT_END\]/g,
    "",
  );
  return withoutContext.trim();
};

export interface AssistAction {
  label?: ReactNode;
  suggestion: string;
  emoji?: string;
  Icon?: FC<{
    width?: number;
    height?: number;
    stroke?: string;
    fill?: string;
  }>;
  reasoning: string;
  subSection?: string;
  /** When set (e.g. sales-assist with question), used as the prompt sent to AskFred on press. */
  submitPrompt?: string;
}

const getBorderColors = (theme: ReturnType<typeof useTheme>) => [
  theme.colors.assistHighlightMint,
  theme.colors.assistHighlightLime,
  theme.colors.assistHighlightCoral,
  theme.colors.assistHighlightGreen,
  theme.colors.assistHighlightViolet,
];

interface DynamicAssistActionItemProps {
  compactMode?: boolean;
  action: AssistAction;
  index: number;
  handleActionPress: (action: AssistAction, isDynamic?: boolean) => void;
  isDisabled: boolean;
  assistMode: string;
  theme: ReturnType<typeof useTheme>;
  isLastItem?: boolean;
  onExpand?: () => void;
  isClicked?: boolean;
  totalCount?: number;
}

export const DynamicAssistActionItem: FC<DynamicAssistActionItemProps> = ({
  action,
  index,
  handleActionPress,
  isDisabled,
  assistMode,
  theme,
  isLastItem,
  onExpand,
  compactMode,
  isClicked,
  totalCount,
}) => {
  const parsedSuggestion = parseUserDisplayContent(action.suggestion);
  const actionKey = `dynamic-${parsedSuggestion}-${index}`;
  const borderColors = getBorderColors(theme);
  const color = borderColors[index % borderColors.length];

  const shouldBeExpanded = totalCount !== undefined && index === totalCount - 1;

  const [isExpanded, setIsExpanded] = useState(shouldBeExpanded);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const expansionProgress = useSharedValue(shouldBeExpanded ? 1 : 0);
  const chevronRotation = useSharedValue(shouldBeExpanded ? 180 : 0);
  const { isHovered, webHoverProps } = useWebHover();
  const prevTotalCountRef = useRef(totalCount);

  const showSubsection =
    assistMode !== ASSIST_MODES.GENERAL && !!action.subSection;

  useEffect(() => {
    const listChanged = prevTotalCountRef.current !== totalCount;
    prevTotalCountRef.current = totalCount;

    if (
      listChanged &&
      totalCount !== undefined &&
      showSubsection &&
      needsExpansion
    ) {
      const newExpanded = index === totalCount - 1;

      // Only update if the expansion state should change
      if (isExpanded !== newExpanded) {
        setIsExpanded(newExpanded);

        chevronRotation.value = withTiming(newExpanded ? -180 : 180, {
          duration: 300,
        });

        expansionProgress.value = withTiming(newExpanded ? 1 : 0, {
          duration: 250,
        });

        if (newExpanded && isLastItem && onExpand) {
          setTimeout(() => {
            onExpand();
          }, 100);
        }
      }
    }
  }, [
    totalCount,
    index,
    showSubsection,
    needsExpansion,
    isExpanded,
    isLastItem,
    onExpand,
    chevronRotation,
    expansionProgress,
  ]);

  const handleFullTextLayout = (event: {
    nativeEvent: { layout: { height: number } };
  }) => {
    if (!showSubsection || needsExpansion) return;
    const { height } = event.nativeEvent.layout;
    const singleLineHeight = 20;

    if (assistMode === ASSIST_MODES.GENERAL) {
      return setNeedsExpansion(false);
    }
    if (height > singleLineHeight * 1.2) {
      setNeedsExpansion(true);
      // If this is the last/most recent item, expand it immediately
      if (totalCount !== undefined && index === totalCount - 1) {
        setIsExpanded(true);
        chevronRotation.value = withTiming(180, { duration: 300 });
        expansionProgress.value = withTiming(1, { duration: 250 });
        if (isLastItem && onExpand) {
          setTimeout(() => {
            onExpand();
          }, 100);
        }
      }
    }
  };

  const toggleExpansion = () => {
    if (assistMode === ASSIST_MODES.GENERAL || !needsExpansion) return;
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    chevronRotation.value = withTiming(newExpanded ? 180 : -180, {
      duration: 300,
    });

    expansionProgress.value = withTiming(newExpanded ? 1 : 0, {
      duration: 250,
    });

    if (newExpanded && isLastItem && onExpand) {
      setTimeout(() => {
        onExpand();
      }, 100);
    }
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const handlePress = () => {
    if (assistMode === ASSIST_MODES.GENERAL) {
      handleActionPress(action, true);
      return;
    }

    if (showSubsection && needsExpansion) {
      toggleExpansion();
      return;
    }

    // Fallback: trigger action for non-GENERAL modes without expandable subsection
    handleActionPress(action, true);
  };

  const containerStyle = useAnimatedStyle(() => {
    if (!showSubsection || !needsExpansion) {
      return {};
    }

    const maxHeight =
      expansionProgress.value * 1000 + (1 - expansionProgress.value) * 200;

    return {
      maxHeight,
      overflow: "hidden",
    };
  });

  const borderColor = isClicked
    ? vars.colors.grey400
    : assistMode === ASSIST_MODES.GENERAL
      ? color
      : theme.colors.borderStaticPage;

  return (
    <View key={actionKey}>
      <Animated.View
        entering={FadeInLeft.duration(400)}
        style={[
          styles.dynamicActionContainer,
          {
            borderWidth: 1,
            borderRadius: 9,
            ...(compactMode
              ? {
                  borderColor: isLastItem
                    ? theme.colors.assistHighlightBorder
                    : theme.colors.borderStaticPage,
                  backgroundColor: theme.colors.borderStaticSubtle,
                }
              : {
                  backgroundColor: theme.colors.interactiveSecondaryDefault,
                  borderColor: isLastItem
                    ? theme.colors.assistHighlightBorder
                    : borderColor,
                }),
          },
          containerStyle,
        ]}
      >
        <Pressable
          {...webHoverProps}
          onPress={handlePress}
          disabled={isDisabled}
          style={({ pressed }) => [
            styles.suggestionCard,
            pressed && styles.suggestionCardPressed,
            isHovered && styles.suggestionCardHovered(theme),
          ]}
        >
          <View
            style={
              assistMode === (ASSIST_MODES.GENERAL || !action?.subSection)
                ? styles.suggestionContentGeneral
                : styles.suggestionContentSalesAssist
            }
          >
            <Text style={styles.emoji}>{action.emoji}</Text>
            <View style={styles.textContainer}>
              <Text
                color="textSecondary"
                variant="body2Regular"
                style={styles.suggestionText}
              >
                {parsedSuggestion}
              </Text>
              {showSubsection && (
                <>
                  {!needsExpansion && (
                    <View
                      style={[
                        styles.subsectionTextContainer,
                        styles.hiddenText,
                      ]}
                      onLayout={handleFullTextLayout}
                    >
                      <Text
                        color="textMuted"
                        variant="body2Regular"
                        style={styles.subsectionText}
                      >
                        {action.subSection}
                      </Text>
                    </View>
                  )}
                  <View style={styles.subsectionTextContainer}>
                    <Text
                      color="textMuted"
                      variant="body2Regular"
                      ellipsizeMode="tail"
                      numberOfLines={isExpanded ? undefined : 1}
                      style={styles.subsectionText}
                    >
                      {action.subSection}
                    </Text>
                  </View>
                </>
              )}
            </View>
            <View style={styles.chevronContainer}>
              {showSubsection && needsExpansion && (
                <Animated.View style={chevronStyle}>
                  {isExpanded ? (
                    <IconChevronDown
                      width={16}
                      height={16}
                      color={theme.colors.textSecondary}
                    />
                  ) : (
                    <IconChevronUp
                      width={16}
                      height={16}
                      color={theme.colors.textSecondary}
                    />
                  )}
                </Animated.View>
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = createStyles({
  dynamicActionContainer: {
    overflow: "hidden",
  },
  suggestionCard: {
    width: "100%",
    cursor: "pointer",
  },
  suggestionCardPressed: {
    opacity: 0.7,
  },
  suggestionCardHovered: (theme) => ({
    backgroundColor: theme.colors.interactiveSecondaryDisabled,
  }),
  suggestionContentSalesAssist: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 7,
  },
  suggestionContentGeneral: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 7,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  emoji: {
    fontSize: 18,
  },
  suggestionText: {
    flex: 1,
    lineHeight: 18,
  },
  subsectionTextContainer: {
    marginTop: 2,
  },
  subsectionText: {
    lineHeight: 20,
    textAlign: "left",
    flexShrink: 0,
  },
  hiddenText: {
    position: "absolute",
    opacity: 0,
    zIndex: -1,
    pointerEvents: "none",
  },
  chevronContainer: {
    marginLeft: "auto",
    height: "100%",
    justifyContent: "flex-end",
  },
});
