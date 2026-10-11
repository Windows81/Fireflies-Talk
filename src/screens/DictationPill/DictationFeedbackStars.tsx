import { IconStar } from "@/assets/svg";
import { createStyles, useTheme } from "@/styles";
import { useState, type FC } from "react";
import { Pressable, View } from "react-native";

const STAR_COUNT = 5;
const STAR_SIZE = 28;

type Props = {
  /** Selects a rating and hands it to the owning form. */
  onRate: (rating: number) => void;
  rating?: number;
};

/**
 * The five hoverable stars from the feedback flow. Hover previews a rating,
 * while an optional rating keeps the selected stars filled.
 */
export const DictationFeedbackStars: FC<Props> = ({ onRate, rating }) => {
  const theme = useTheme();
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const fill = hoveredStar ?? rating ?? 0;

  return (
    <View style={styles.row} onPointerLeave={() => setHoveredStar(null)}>
      {Array.from({ length: STAR_COUNT }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= fill;
        const starColor = isFilled
          ? theme.colors.textBrand
          : theme.colors.commandHintDefault;

        return (
          <Pressable
            key={starValue}
            onPress={() => onRate(starValue)}
            onPointerEnter={() => setHoveredStar(starValue)}
            style={styles.star}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${starValue} out of ${STAR_COUNT} stars`}
            accessibilityState={{ selected: isFilled }}
          >
            <IconStar
              color={starColor}
              width={STAR_SIZE}
              height={STAR_SIZE}
              strokeWidth={1.5}
              {...(isFilled && { fill: starColor })}
            />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = createStyles({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  star: {
    padding: 2,
    cursor: "pointer",
  },
});
