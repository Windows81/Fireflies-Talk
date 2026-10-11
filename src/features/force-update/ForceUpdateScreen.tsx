import IconLogo from "@/assets/svg/IconLogo";
import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { useTheme } from "@/styles";
import { openStoreUrl } from "@/utils/updates";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const ForceUpdateScreen: FC = () => {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.pageBackground },
      ]}
    >
      <View style={styles.content}>
        <IconLogo width={64} height={64} />
        <Text variant="title1Weight" style={styles.title}>
          Update Required!
        </Text>
        <Text
          variant="body1Regular"
          color="textSecondary"
          style={styles.subtitle}
        >
          A new version of Fireflies is available. Please update to continue
          using the app.
        </Text>
        <Button variant="primary" size="lg" onPress={openStoreUrl}>
          <Text variant="body1Weight" color="textContrast">
            Update Now
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  title: {
    marginTop: 8,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 8,
  },
});
