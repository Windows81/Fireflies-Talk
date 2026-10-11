import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { IconLogOut } from "@/assets/svg";
import { authApi } from "@/features/auth";
import { StyleSheet } from "react-native";
import { useTheme } from "@/styles";

export const DesktopSettingsHeaderRight: React.FC = () => {
  const theme = useTheme();
  return (
    <Button
      variant="transparentNeutral"
      size="sm"
      onPress={() => authApi.logout("User action")}
      style={styles.logout}
    >
      <Text variant="body3Weight" color="textPrimary">
        Log Out
      </Text>
      <IconLogOut width={16} height={16} color={theme.colors.textPrimary} />
    </Button>
  );
};

const styles = StyleSheet.create({
  logout: {
    marginRight: 8,
    paddingHorizontal: 5,
  },
});
