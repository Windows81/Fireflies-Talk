import { IconLogo } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { useTheme } from "@/styles";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";

export const DesktopLoginHeader: FC = () => {
  const theme = useTheme();

  return (
    <>
      <View style={styles.logoContainer}>
        <IconLogo width={28} height={28} color={theme.colors.textPrimary} />
      </View>
      <Text
        variant="heading4Weight"
        style={styles.heading}
        allowFontScaling={false}
      >
        Welcome to Fireflies
      </Text>
    </>
  );
};

const styles = StyleSheet.create({
  heading: {
    marginTop: 32,
    textAlign: "center",
    width: "100%",
  },
  logoContainer: {
    marginTop: 0,
    alignSelf: "center",
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "linear-gradient(180deg, #363637 0%, #1E1E1F 38.16%, #151617 100%)",
    borderRadius: 12,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    boxShadow:
      "2px 2px 2px 0 rgba(255, 255, 255, 0.16) inset, 0 0 8px 0 rgba(255, 255, 255, 0.10) inset",
  },
});
