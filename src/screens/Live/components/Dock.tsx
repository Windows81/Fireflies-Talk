import { createStyles, useTheme, vars } from "@/styles";
import type { FC, ReactNode } from "react";
import { View } from "react-native";
import { useGlassSync } from "src/hooks/useGlassSync";
import { DesktopBottomGradient } from "./DesktopBottomGradient";

const DOCK_CORNER_RADIUS = 8;
const DOCK_PADDING_H = 10;
const DOCK_PADDING_V = 6;
const DOCK_GAP = 8;

export const Dock: FC<{
  children: ReactNode;
  isMinimized?: boolean;
  glassSyncKey?: string;
}> = ({ children, isMinimized = false, glassSyncKey = "dock" }) => {
  const theme = useTheme();
  const dockGlassRef = useGlassSync(
    glassSyncKey,
    !isMinimized,
    DOCK_CORNER_RADIUS,
  );

  return (
    <View style={styles.wrapper}>
      <View ref={dockGlassRef} style={styles.bar(theme)}>
        <DesktopBottomGradient />
        {children}
      </View>
    </View>
  );
};

const styles = createStyles({
  wrapper: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: 5,
  },
  bar: (theme) => ({
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DOCK_PADDING_H,
    paddingVertical: DOCK_PADDING_V,
    gap: DOCK_GAP,
    backgroundColor: theme.colors.pageBackground,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    borderRadius: DOCK_CORNER_RADIUS,
    ...vars.elevations[2],
    boxShadow:
      "0px 0px 4px 2px rgba(255, 255, 255, 0.16) inset, 0px 4px 4px rgba(0, 0, 0, 0.1)",
  }),
});
