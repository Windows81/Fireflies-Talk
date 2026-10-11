import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { openStoreUrl, useHasNewUpdates } from "@/utils/updates";
import { type FC } from "react";
import { View } from "react-native";

export const useShowUpdateBanner = () => {
  return useHasNewUpdates();
};

export const UpdateBanner: FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.root(theme)}>
      <Text variant="label2Weight">Update available</Text>
      <Text variant="body2Regular" color="textSecondary">
        Download the latest version to get the latest features and bug fixes.
      </Text>
      <Button
        variant="outlined"
        size="xs"
        style={styles.button}
        onPress={openStoreUrl}
      >
        Get it now
      </Button>
    </View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    borderColor: theme.colors.informationStaticGreenSolid,
    borderWidth: 1,
    padding: 16,
    borderRadius: 8,
    gap: 4,
    marginBottom: 16,
    width: "100%",
  }),
  button: {
    marginTop: 8,
  },
});
