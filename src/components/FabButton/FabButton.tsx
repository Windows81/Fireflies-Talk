import { AnimatedTouchableHighlight } from "@/components/Animated";
import { createStyles, useTheme, vars } from "@/styles";
import type { FC } from "react";
import { View, type TouchableHighlightProps } from "react-native";
import { ZoomIn, ZoomOut } from "react-native-reanimated";
import type { SvgProps } from "react-native-svg";
import { Text } from "../Typography";

const fabStyles = createStyles({
  fab: (theme) => ({
    // Dark: layerDefault equals the page background, leaving the FAB nearly
    // invisible, so raise it onto a lighter surface. Light keeps white.
    backgroundColor:
      theme.name === "dark"
        ? theme.colors.layerStrong
        : theme.colors.layerDefault,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticDefault,
    ...vars.elevations[2],
  }),
  fabBadge: (theme) => ({
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    textAlign: "center",
    backgroundColor: theme.colors.layerBrandLight2,
    color: theme.colors.textBrand,
    paddingHorizontal: 4,
    borderRadius: 16,
  }),
  fabWrapper: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});

export const FabButton: FC<
  {
    Icon: FC<SvgProps>;
    iconSize?: number;
    badge?: number;
  } & TouchableHighlightProps
> = ({ Icon, iconSize, badge, ...props }) => {
  const theme = useTheme();

  return (
    <AnimatedTouchableHighlight
      underlayColor={theme.colors.layerSubtle}
      {...props}
      style={[fabStyles.fab(theme), props.style]}
      entering={ZoomIn.duration(100)}
      exiting={ZoomOut.duration(100)}
    >
      <View style={fabStyles.fabWrapper}>
        <Icon
          width={iconSize || 24}
          height={iconSize || 24}
          color={theme.colors.commandNeutralDefault}
        />
        {typeof badge === "number" && (
          <Text style={fabStyles.fabBadge(theme)}>{badge}</Text>
        )}
      </View>
    </AnimatedTouchableHighlight>
  );
};
