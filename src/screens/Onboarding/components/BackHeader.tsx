import { IconArrowLeft } from "@/assets/svg";
import { Button } from "@/components/Button";
import { useContext, type FC } from "react";
import { StyleSheet, View } from "react-native";
import { OnboardingContext } from "../Context";

export const BackHeader: FC = () => {
  const { goPrev } = useContext(OnboardingContext);
  return (
    <View style={styles.backHeader}>
      <Button
        variant="transparentNeutral"
        Icon={IconArrowLeft}
        aria-label="Back"
        onPress={goPrev}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  backHeader: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
});
