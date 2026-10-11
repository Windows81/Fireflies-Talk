import { useNavigation } from "@react-navigation/native";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "../Button";
import { Text } from "../Typography";

export const NotFoundScreen: FC<{
  title: string;
  description: string;
}> = ({ title, description }) => {
  const navigation = useNavigation();
  return (
    <View nativeID="drag-region" style={styles.root}>
      <Text variant="title1Weight">{title}</Text>
      <Text color="textSecondary">{description}</Text>
      <Button
        nativeID="no-drag"
        style={styles.button}
        onPress={() => navigation.goBack()}
      >
        Go back
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  button: {
    marginTop: 24,
  },
});
