import { IconSearch } from "@/assets/svg";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";

export const SearchIconCircle: FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.root(theme)}>
      <IconSearch color={theme.colors.textMuted} width={20} height={20} />
    </View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    width: 44,
    height: 44,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.layerStrong,
    marginBottom: 4,
  }),
});
