import { IconX } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { Pressable, View } from "react-native";

interface WalkthroughStepProps {
  title: string;
  description: string;
  stepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onClose: () => void;
}

export const WalkthroughStep: FC<WalkthroughStepProps> = ({
  title,
  description,
  stepNumber,
  totalSteps,
  onNext,
  onClose,
}) => {
  const theme = useTheme();
  const isLastStep = stepNumber === totalSteps;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.textContent}>
          <Text variant="title3Weight" color="textContrast">
            {title}
          </Text>
          <Text
            variant="body2Regular"
            color="textContrast"
            style={styles.description}
          >
            {description}
          </Text>
        </View>
        <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
          <IconX width={20} height={20} color="rgba(255, 255, 255, 0.6)" />
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text
          variant="body3Regular"
          color="textContrast"
          style={styles.pagination}
        >
          {`${stepNumber} of ${totalSteps}`}
        </Text>
        <Pressable style={styles.nextButton(theme)} onPress={onNext}>
          <Text
            variant="label2Weight"
            style={{ color: theme.colors.textBrand }}
          >
            {isLastStep ? "Got It" : "Next"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = createStyles({
  container: {
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  textContent: {
    flex: 1,
    gap: 6,
  },
  description: {
    opacity: 0.85,
  },
  closeButton: {
    padding: 2,
    borderRadius: 4,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pagination: {
    opacity: 0.85,
  },
  nextButton: (theme) => ({
    backgroundColor: theme.colors.layerDefault,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    height: 32,
    justifyContent: "center",
  }),
});
