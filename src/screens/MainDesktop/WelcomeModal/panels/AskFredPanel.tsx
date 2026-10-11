import { Text } from "@/components/Typography";
import { DESKTOP_THEME } from "@/styles/color";
import { Image } from "expo-image";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";
import { WelcomeCard } from "../components/WelcomeCard";
import askFredImage from "../assets/askfred.png";

export const AskFredPanel: FC = () => {
  return (
    <WelcomeCard style={styles.card}>
      <Image source={askFredImage} style={styles.image} contentFit="contain" />
      <View style={styles.textBlock}>
        <Text variant="title2Weight" style={styles.title}>
          AskFred Anything
        </Text>
        <Text variant="body2Regular" style={styles.description}>
          AskFred anything during live calls — get instant answers, summaries,
          and more.
        </Text>
      </View>
    </WelcomeCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: 16,
  },
  textBlock: {
    gap: 6,
  },
  title: {
    color: DESKTOP_THEME.grey500,
  },
  description: {
    color: DESKTOP_THEME.grey550,
  },
  image: {
    width: "100%",
    height: 160,
    alignSelf: "stretch",
  },
});
