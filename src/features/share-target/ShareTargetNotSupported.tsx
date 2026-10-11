import { Button } from "@/components/Button";
import { MessageView } from "@/components/Message";
import type { ShareData } from "@/modules/share-target";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";

export const ShareTargetNotSupported: FC<{
  sharedData: ShareData;
  close: () => void;
}> = ({ sharedData, close }) => {
  return (
    <View style={styles.container}>
      <MessageView
        title="Not supported"
        description={`"${
          sharedData.files?.[0]?.name || sharedData.url || sharedData.text
        }" is not supported by Fireflies. Please try sharing something else.`}
        action={
          <Button onPress={close} variant="outlined">
            Done
          </Button>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 200,
  },
});
