import { Text } from "@/components/Typography";
import type { FC, PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

export const SettingField: FC<PropsWithChildren> = ({ children }) => {
  return <View style={styles.field}>{children}</View>;
};

export const SettingsGroup: FC<PropsWithChildren<{ title: string }>> = ({
  children,
  title,
}) => {
  return (
    <View style={styles.group}>
      <Text variant="title2Weight" color="textPrimary">
        {title}
      </Text>
      {children}
    </View>
  );
};

export const SettingLabel: FC<{
  id?: string;
  title: string;
  description?: string;
}> = ({ title, description, id }) => {
  return (
    <View style={styles.label} id={id}>
      <Text variant="label2Weight" color="textSecondary">
        {title}
      </Text>
      {description && (
        <Text variant="body2Regular" color="textMuted">
          {description}
        </Text>
      )}
    </View>
  );
};

export const SettingRow: FC<PropsWithChildren> = ({ children }) => {
  return <View style={styles.row}>{children}</View>;
};

const styles = StyleSheet.create({
  field: {
    flexDirection: "column",
    gap: 12,
  },
  label: {
    flexDirection: "column",
    gap: 8,
    flex: 1,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  group: {
    flexDirection: "column",
    gap: 20,
  },
});
