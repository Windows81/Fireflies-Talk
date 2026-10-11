import { createStyles, useTheme, vars } from "@/styles";
import { useContext, useEffect, type FC } from "react";
import { Animated, Pressable, View } from "react-native";
import type {
  NavigationState,
  SceneRendererProps,
} from "react-native-tab-view";
import { Text } from "../Typography";
import { TabsContext } from "./TabsContext";
import type { TabData } from "./types";

interface TabProps {
  jumpTo: (key: string) => void;
  route: TabData;
  isSelected: boolean;
}

const Tab: FC<TabProps> = ({ route, jumpTo, isSelected }) => {
  const { disabled } = useContext(TabsContext);
  return (
    <Pressable
      onPress={() => jumpTo(route.key)}
      style={styles.tab}
      disabled={disabled}
    >
      <Text
        variant="label2Regular"
        color={isSelected ? "commandPrimaryDefault" : "commandNeutralDefault"}
        numberOfLines={1}
      >
        {route.title}
      </Text>
      {route.tabTrailing}
    </Pressable>
  );
};

export const TabList: FC<
  SceneRendererProps & {
    navigationState: NavigationState<TabData>;
  }
> = ({ navigationState, layout, jumpTo, position }) => {
  const theme = useTheme();

  const translateX = position.interpolate({
    inputRange: [0, navigationState.routes.length],
    outputRange: [0, layout.width],
  });

  const { tabBarStyle } = useContext(TabsContext);

  useEffect(() => {
    // to prevent warning: "Sending `onAnimatedValueUpdate` with no listeners registered."
    // https://github.com/react-navigation/react-navigation/issues/11564
    const id = position.addListener(() => {});
    return () => {
      position.removeListener(id);
    };
  }, [position]);

  return (
    <View style={[styles.tabBar(theme), tabBarStyle]}>
      {navigationState.routes.map((route, index) => (
        <Tab
          key={route.key}
          jumpTo={jumpTo}
          route={route}
          isSelected={navigationState.index === index}
        />
      ))}
      <Animated.View
        style={[
          styles.indicator(theme),
          {
            width: `${100 / navigationState.routes.length}%`,
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

const styles = createStyles({
  tabBar: (theme) => ({
    minHeight: 48,
    alignItems: "stretch",
    width: "100%",
    flexDirection: "row",
    borderBottomColor: theme.colors.borderStaticDefault,
    borderBottomWidth: 1,
    backgroundColor: theme.colors.pageBackground,
    ...vars.elevations[1],
  }),
  tab: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  indicator: (theme) => ({
    position: "absolute",
    bottom: 0,
    height: 1,
    backgroundColor: theme.colors.borderInteractiveActive,
  }),
});
