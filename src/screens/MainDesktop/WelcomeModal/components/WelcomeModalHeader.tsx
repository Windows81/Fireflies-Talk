import { Text } from "@/components/Typography";
import { useGetCurrentUserQuery } from "@/graphql";
import { DESKTOP_THEME } from "@/styles/color";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";

export const WelcomeModalHeader: FC = () => {
  const { data } = useGetCurrentUserQuery();
  const firstName = data?.user?.profile?.firstName || "there";

  return (
    <View style={styles.root}>
      <View style={styles.emojiBox}>
        <Text style={styles.emoji}>🎉</Text>
      </View>
      <Text
        variant="heading4Weight"
        color="textPrimary"
        textAlign="center"
        style={styles.title}
      >
        Hi {firstName}, Welcome to Fireflies
      </Text>
      <Text
        variant="body1Regular"
        color="textMuted"
        textAlign="center"
        style={styles.subtitle}
      >
        Discover how to capture your conversations seamlessly
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 24,
  },
  emojiBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: DESKTOP_THEME.grey950,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emoji: {
    fontSize: 28,
    lineHeight: 32,
  },
  title: {
    maxWidth: 480,
  },
  subtitle: {
    marginTop: 6,
    maxWidth: 420,
  },
});
