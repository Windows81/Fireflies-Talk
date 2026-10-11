import { createStyles, useTheme, vars } from "@/styles";
import type { FC, PropsWithChildren } from "react";
import { View } from "react-native";

export const HeaderBlock: FC<PropsWithChildren> = ({ children }) => {
  const theme = useTheme();
  return <View style={styles.headerBlock(theme)}>{children}</View>;
};

const styles = createStyles({
  headerBlock: (theme) => ({
    ...vars.elevations[1],
    backgroundColor: theme.colors.layerDefault,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.borderStaticDefault,
    borderRadius: 8,
  }),
});
