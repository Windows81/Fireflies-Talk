import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME, withAlpha } from "@/styles/color";
import type { FC, ReactNode } from "react";
import { View, type DimensionValue } from "react-native";

interface AppMockupProps {
  icon: ReactNode;
  name: string;
  width: DimensionValue;
  children: ReactNode;
}

export const AppMockup: FC<AppMockupProps> = ({
  icon,
  name,
  width,
  children,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.mockup, { width }]}>
      <View style={styles.topBar(theme)}>
        {icon}
        <Text variant="body2Weight" color="textSecondary">
          {name}
        </Text>
      </View>
      {children}
    </View>
  );
};

const styles = createStyles({
  mockup: {
    backgroundColor: DESKTOP_THEME.grey1010,
    borderRadius: 16,
    overflow: "hidden" as const,
  },
  topBar: (theme) => ({
    flexDirection: "row" as const,
    alignItems: "center" as const,
    height: 44,
    paddingHorizontal: 16,
    gap: 6,
    backgroundColor: withAlpha(theme.colors.textPrimary, 0.06),
  }),
});
