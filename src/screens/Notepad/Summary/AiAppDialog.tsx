import { LinkButton } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { Text } from "@/components/Typography";
import { RouteNames } from "@/constants";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";

export const AiAppDialog: FC<{
  isOpenAiAppBanner: boolean;
  closeAiAppBanner: () => void;
}> = ({ isOpenAiAppBanner, closeAiAppBanner }) => {
  return (
    <Dialog.Root
      isOpen={isOpenAiAppBanner}
      close={closeAiAppBanner}
      variant="bottomSheet"
    >
      <Dialog.Close />
      <View style={styles.aiAppBanner}>
        <Text variant="title1Weight">
          Supercharge your meetings with AI Skills
        </Text>
        <Text variant="body1LongRegular">
          Automate actions from meetings, ask questions, customize notes, and do
          much more with AI Skills.
        </Text>
        <LinkButton
          onPress={closeAiAppBanner}
          href={{
            pathname: RouteNames.Extensions,
            params: {
              utm_content: "notepad/meeting-summary/section",
            },
          }}
        >
          Learn more
        </LinkButton>
      </View>
    </Dialog.Root>
  );
};

const styles = StyleSheet.create({
  aiAppBanner: {
    padding: 24,
    gap: 16,
  },
});
