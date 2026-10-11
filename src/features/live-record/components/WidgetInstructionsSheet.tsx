import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import {
  imageWidgetStep1Android,
  imageWidgetStep1Ios,
  imageWidgetStep2Android,
  imageWidgetStep2Ios,
  imageWidgetStep3Ios,
} from "@/assets/images";
import { createStyles, useTheme, vars } from "@/styles";
import type { BottomSheetFooterProps } from "@gorhom/bottom-sheet";
import { useCallback, type FC } from "react";
import { Image, Platform, View, type ImageSourcePropType } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Step = {
  description: string;
  image: ImageSourcePropType;
};

const STEPS_BY_PLATFORM: Record<"ios" | "android", Step[]> = {
  ios: [
    {
      description:
        "Long-press an empty area on your home or lock screen and tap Edit.",
      image: imageWidgetStep1Ios,
    },
    {
      description: "Choose Add Widget from the menu.",
      image: imageWidgetStep2Ios,
    },
    {
      description: "Search for Fireflies and add the widget.",
      image: imageWidgetStep3Ios,
    },
  ],
  android: [
    {
      description:
        "Long-press an empty area on your home screen, then tap Widgets.",
      image: imageWidgetStep1Android,
    },
    {
      description:
        "Search for Fireflies and drag the widget to your home screen.",
      image: imageWidgetStep2Android,
    },
  ],
};

const StepRow: FC<{ index: number; step: Step }> = ({ index, step }) => {
  const resolved = Image.resolveAssetSource(
    step.image as Parameters<typeof Image.resolveAssetSource>[0],
  );
  const aspectRatio =
    resolved && resolved.height > 0 ? resolved.width / resolved.height : 1;
  return (
    <View style={styles.step}>
      <View style={styles.stepHeader}>
        <View style={styles.numberCircle}>
          <Text variant="body1Weight" style={styles.numberText}>
            {index + 1}
          </Text>
        </View>
        <Text
          variant="body1Regular"
          color="textPrimary"
          style={styles.stepDescription}
        >
          {step.description}
        </Text>
      </View>
      <Image
        source={step.image}
        style={[styles.stepImage, { aspectRatio }]}
        resizeMode="contain"
      />
    </View>
  );
};

export const WidgetInstructionsSheet: FC<{
  isOpen: boolean;
  close: () => void;
}> = ({ isOpen, close }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const platform = Platform.OS === "android" ? "android" : "ios";
  const steps = STEPS_BY_PLATFORM[platform];

  const bottomInset = Platform.select({
    android: insets.bottom,
    ios: 8,
  });

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheet.Footer {...props} bottomInset={bottomInset}>
        <View style={styles.footer(theme)}>
          <Button variant="primary" size="lg" onPress={close}>
            Got it
          </Button>
        </View>
      </BottomSheet.Footer>
    ),
    [bottomInset, theme, close],
  );

  return (
    <BottomSheet.Root
      isOpen={isOpen}
      close={close}
      snapPoints={["100%"]}
      footerComponent={renderFooter}
    >
      <BottomSheet.ScrollView
        contentContainerStyle={[
          styles.scrollContent(theme),
          { paddingBottom: 96 + insets.bottom },
        ]}
      >
        <Text variant="title2Weight" style={styles.title}>
          Add the Fireflies widget
        </Text>
        <View style={styles.steps}>
          {steps.map((step, index) => (
            <StepRow key={index} index={index} step={step} />
          ))}
        </View>
      </BottomSheet.ScrollView>
    </BottomSheet.Root>
  );
};

const styles = createStyles({
  scrollContent: (theme) => ({
    paddingHorizontal: 20,
    paddingTop: 8,
    backgroundColor: theme.colors.layerDefault,
    gap: 16,
  }),
  title: {
    textAlign: "center",
  },
  steps: {
    gap: 28,
    marginTop: 12,
  },
  step: {
    gap: 12,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  numberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: vars.colors.purple600,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  numberText: {
    color: vars.colors.purple25,
  },
  stepDescription: {
    flex: 1,
    lineHeight: 24,
  },
  stepImage: {
    width: "50%",
    height: undefined,
    borderRadius: 24,
    alignSelf: "center",
  },
  footer: (theme) => ({
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: theme.colors.layerDefault,
  }),
});
