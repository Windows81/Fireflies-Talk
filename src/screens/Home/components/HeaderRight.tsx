import { IconPlus } from "@/assets/svg";
import { HeaderSideContainer } from "@/components/Layout";
import { useAiPinEntry } from "@/features/ai-pin/entry.store";
import { useAiPinEnabled } from "@/features/ai-pin/useAiPinEnabled";
import { useOpenAddModal } from "@/features/global-modals";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { Pressable, View } from "react-native";
import { HomeScreenWalkthroughTarget } from "../HomeScreenWalkthrough";

export const HeaderRight: FC = () => {
  const openAddModal = useOpenAddModal();
  const theme = useTheme();
  const aiPinEnabled = useAiPinEnabled();
  const recorder = useAiPinEntry();

  if (!openAddModal) return null;

  return (
    <HeaderSideContainer forcePadding style={styles.container}>
      {aiPinEnabled && recorder.visible && recorder.open && (
        <Pressable
          onPress={recorder.open}
          accessibilityRole="button"
          accessibilityLabel={
            recorder.recording ? "AI Pin, recording active" : "Open AI Pin"
          }
          style={styles.recorderButton(theme)}
        >
          <View style={styles.recorderBody(theme)} />
          {recorder.recording && <View style={styles.recordingDot(theme)} />}
        </Pressable>
      )}
      <HomeScreenWalkthroughTarget stepKey="capture">
        <Pressable
          onPress={() => openAddModal("home/add-button")}
          aria-label="Add"
          style={styles.addButton(theme)}
        >
          <IconPlus
            width={20}
            height={20}
            // Light keeps the brand icon: white would vanish on its purple50 fill.
            color={
              theme.name === "dark"
                ? theme.colors.commandContrastDefault
                : theme.colors.textBrand
            }
          />
        </Pressable>
      </HomeScreenWalkthroughTarget>
    </HeaderSideContainer>
  );
};

const styles = createStyles({
  recorderButton: (theme) => ({
    alignItems: "center",
    backgroundColor: theme.colors.interactiveSecondaryDefault,
    borderColor: theme.colors.borderStaticDefault,
    borderRadius: 8,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    position: "relative",
    width: 34,
  }),
  recorderBody: (theme) => ({
    borderColor: theme.colors.textBrand,
    borderRadius: 3,
    borderWidth: 1.5,
    height: 22,
    width: 14,
  }),
  recordingDot: (theme) => ({
    backgroundColor: theme.colors.informationStaticRedText,
    borderColor: theme.colors.layerDefault,
    borderRadius: 5,
    borderWidth: 1.5,
    bottom: 2,
    height: 9,
    position: "absolute",
    right: 2,
    width: 9,
  }),
  addButton: (theme) => ({
    backgroundColor: theme.colors.interactiveSecondaryDefault,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticDefault,
    padding: 6,
  }),
  container: {
    gap: 8,
    paddingRight: 22,
  },
});
