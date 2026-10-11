import { createStyles, useTheme } from "@/styles";
import { useNavigation } from "@react-navigation/native";
import type { FC } from "react";
import { View } from "react-native";
import type { SvgProps } from "react-native-svg";
import { Button } from "../Button";
import { Text } from "../Typography";
import { isDesktop } from "@/utils/device";

export const ErrorScreen: FC<{
  Icon?: FC<SvgProps>;
  title?: string;
  description?: string;
  retry?: () => void;
  login?: () => void;
}> = ({ Icon, title = "Something went wrong", description, retry, login }) => {
  const navigation = useNavigation();
  const theme = useTheme();

  const onActionPress = () => {
    if (isDesktop) {
      window.electron?.window.closeAndFocusMain();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.root(theme)}>
      {Icon && <Icon width={24} height={24} color={theme.colors.textPrimary} />}
      <View style={styles.content}>
        <Text variant="title1Weight" style={styles.text}>
          {title}
        </Text>
        <Text color="textSecondary" style={styles.text}>
          {description}
        </Text>
      </View>
      {retry && (
        <Button style={styles.button} onPress={() => retry()}>
          Retry
        </Button>
      )}
      {login ? (
        <Button style={styles.button} onPress={login}>
          Login
        </Button>
      ) : (
        <Button
          style={styles.button}
          onPress={onActionPress}
          variant="outlined"
        >
          {isDesktop ? "Close" : "Go back"}
        </Button>
      )}
    </View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    backgroundColor: theme.colors.layerDefault,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  }),
  content: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  button: {
    marginTop: 12,
  },
  text: {
    textAlign: "center",
  },
});
