import { imageMeetingToggleMockup } from "@/assets/images";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { Text } from "@/components/Typography";
import { Image } from "expo-image";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";

export const CalendarAccessExplainDialog: FC<{
  isOpen: boolean;
  close: () => void;
}> = ({ isOpen, close }) => {
  return (
    <Dialog.Root isOpen={isOpen} close={close} variant="bottomSheet">
      <View style={styles.root}>
        <Image
          source={imageMeetingToggleMockup}
          style={styles.image}
          contentFit="cover"
          contentPosition="center"
          alt=""
        />
        <Text variant="body1Weight">
          Effortlessly transcribe your meetings.
        </Text>
        <Text variant="body1Regular" color="textSecondary">
          Fireflies syncs your calendar events containing web-conferencing
          links.
        </Text>
        <Text variant="body1Regular" color="textSecondary">
          You can easily select meetings that you want Fireflies to join and
          transcribe or set to automatically transcribe meetings.
        </Text>
        <Button style={styles.button} onPress={close}>
          Got it!
        </Button>
      </View>
    </Dialog.Root>
  );
};

const styles = StyleSheet.create({
  root: {
    gap: 12,
    padding: 24,
    width: "100%",
  },
  image: {
    width: "100%",
    height: 128,
    objectFit: "cover",
    borderRadius: 8,
  },
  button: {
    marginTop: 12,
  },
});
