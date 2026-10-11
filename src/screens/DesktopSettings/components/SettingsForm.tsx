import { Text } from "@/components/Typography";
import { useTheme } from "@/styles";
import type { FC, PropsWithChildren, ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import type { SvgProps } from "react-native-svg";

export const SettingField: FC<PropsWithChildren> = ({ children }) => {
  return <View style={styles.field}>{children}</View>;
};

export const SettingsGroup: FC<PropsWithChildren<{ Icon?: FC<SvgProps> }>> = ({
  children,
  Icon,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.group}>
      {Icon && (
        <Icon
          width={20}
          height={20}
          style={styles.icon}
          color={theme.colors.textPrimary}
        />
      )}
      {children}
    </View>
  );
};

export const SettingLabel: FC<{
  id?: string;
  title: string;
  description?: ReactNode;
}> = ({ title, description, id }) => {
  return (
    <View style={styles.label} id={id}>
      <Text variant="title3Weight" color="textSecondary">
        {title}
      </Text>
      {typeof description === "string" ? (
        <Text variant="body2Regular" color="textMuted">
          {description}
        </Text>
      ) : (
        description
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
    flex: 1,
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
    flexDirection: "row",
    gap: 24,
  },
  icon: {
    minWidth: 20,
  },
});
