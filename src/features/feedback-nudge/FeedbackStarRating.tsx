import { IconStar } from "@/assets/svg";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { EnumFeedbackType, useGiveFeedbackMutation } from "@/graphql";
import { useFeedbackClientInfo } from "@/hooks/useFeedbackClientInfo";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { useCallback, useState } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const STAR_COUNT = 5;
const EMPTY_STAR_OPACITY_LIGHT = 0.2;
const EMPTY_STAR_OPACITY_DARK = 0.35;
const EXIT_DURATION_MS = 200;
const EXIT_TRANSLATE_Y = -12;

export interface FeedbackStarRatingProps {
  title: string;
  successTitle?: string;
  starColor?: string;
  category?: string;
  source?: string;
  animateOut?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const FeedbackStarRating: FC<FeedbackStarRatingProps> = ({
  title,
  successTitle = "Thanks for the feedback!",
  starColor,
  category,
  source,
  animateOut = true,
  style,
}) => {
  const theme = useTheme();
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const { appVersion, os } = useFeedbackClientInfo();

  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleSuccess = useCallback(() => {
    toast({ message: successTitle, type: "success" });
    if (!animateOut) {
      setSubmitted(true);
      return;
    }
    const easing = Easing.out(Easing.cubic);
    opacity.value = withTiming(0, { duration: EXIT_DURATION_MS, easing });
    translateY.value = withTiming(
      EXIT_TRANSLATE_Y,
      { duration: EXIT_DURATION_MS, easing },
      (finished) => {
        if (finished) runOnJS(setSubmitted)(true);
      },
    );
  }, [animateOut, opacity, translateY, successTitle]);

  const [giveFeedback] = useGiveFeedbackMutation({
    onCompleted: handleSuccess,
    onError() {
      setRating(0);
      toast({ message: "Could not submit feedback", type: "error" });
    },
  });

  if (submitted) return null;

  // Dark mode wants brighter, more neon stars; commandPrimaryHover is the
  // brightest purple token (purple300). Light keeps the standard brand purple.
  const color =
    starColor ??
    (theme.name === "dark"
      ? theme.colors.commandPrimaryHover
      : theme.colors.textBrand);
  const emptyStarOpacity =
    theme.name === "dark" ? EMPTY_STAR_OPACITY_DARK : EMPTY_STAR_OPACITY_LIGHT;
  const isLocked = rating !== 0;

  const handlePress = (value: number) => {
    if (isLocked) return;
    setRating(value);
    giveFeedback({
      variables: {
        input: {
          type: EnumFeedbackType.Feedback,
          category,
          rating: value,
          ...(source && { source }),
          appVersion,
          os,
        },
      },
    });
  };

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      <Text variant="title3Weight" color="textSecondary" style={styles.title}>
        {title}
      </Text>
      <View style={styles.starRow}>
        {Array.from({ length: STAR_COUNT }, (_, i) => {
          const value = i + 1;
          const isFilled = value <= rating;
          return (
            <Pressable
              key={value}
              onPress={() => handlePress(value)}
              disabled={isLocked}
              hitSlop={6}
              style={[
                styles.starButton,
                { opacity: isFilled ? 1 : emptyStarOpacity },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Rate ${value} out of ${STAR_COUNT} stars`}
              accessibilityState={{ selected: isFilled }}
            >
              <IconStar
                color={color}
                fill={color}
                width={36}
                height={36}
                strokeWidth={1.5}
              />
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = createStyles({
  container: {
    alignItems: "center",
    gap: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  title: {
    textAlign: "center",
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  starButton: {
    padding: 4,
  },
});
