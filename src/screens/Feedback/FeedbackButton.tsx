import { IconMessageCircle } from "@/assets/svg";
import { useWebHover } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { type FC, useState } from "react";
import { Pressable } from "react-native";
import { FeedbackModal } from "./FeedbackModal";

interface FeedbackButtonProps {
  category?: string;
  title?: string;
  description?: string;
  feedbackCategories?: readonly string[];
}

/**
 * "Feedback" pill that opens the feedback modal. Used in desktop header bars
 * (realtime panel, notepad) next to Share.
 */
export const FeedbackButton: FC<FeedbackButtonProps> = ({
  category = "Live Assist (Desktop)",
  title,
  description,
  feedbackCategories,
}) => {
  const theme = useTheme();
  const [isOpen, setOpen] = useState(false);
  const { isHovered, webHoverProps } = useWebHover();

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.button, isHovered && styles.buttonHover(theme)]}
        accessibilityRole="button"
        accessibilityLabel="Feedback"
        {...webHoverProps}
      >
        <IconMessageCircle
          width={16}
          height={16}
          color={theme.colors.textMuted}
          strokeWidth={2}
        />
        <Text variant="body2Regular" color="textMuted">
          Feedback
        </Text>
      </Pressable>
      <FeedbackModal
        isOpen={isOpen}
        close={() => setOpen(false)}
        onShare={() => setOpen(false)}
        category={category}
        title={title}
        description={description}
        feedbackCategories={feedbackCategories}
      />
    </>
  );
};

const styles = createStyles({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  buttonHover: (theme) => ({
    backgroundColor: theme.colors.interactiveNeutral2Hover,
  }),
});
