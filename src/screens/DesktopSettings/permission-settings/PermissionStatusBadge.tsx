import { type FC } from "react";
import { View } from "react-native";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { PermissionStatus } from "electron/src/types";

interface PermissionStatusBadgeProps {
  status: PermissionStatus | undefined;
}

export const PermissionStatusBadge: FC<PermissionStatusBadgeProps> = ({
  status,
}) => {
  const theme = useTheme();

  const statusText =
    status === "granted"
      ? "Granted"
      : status === "denied"
        ? "Denied"
        : status === "not-determined"
          ? "Not requested"
          : "Unknown";

  const statusBgColor =
    status === "granted"
      ? theme.colors.informationStaticGreenSubtle
      : status === "denied"
        ? theme.colors.informationStaticRedSubtle
        : theme.colors.layerMuted;

  const statusTextColor =
    status === "granted"
      ? "informationStaticGreenText"
      : status === "denied"
        ? "informationStaticRedText"
        : "textSecondary";

  return (
    <View style={[styles.badge, { backgroundColor: statusBgColor }]}>
      <Text variant="label2Weight" color={statusTextColor}>
        {statusText}
      </Text>
    </View>
  );
};

const styles = createStyles({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
});
