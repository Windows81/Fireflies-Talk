import type { PropsWithChildren, ReactNode } from "react";
import {
  Children,
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
  type FC,
  type ReactElement,
} from "react";
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { PagerViewProps } from "react-native-pager-view";
import {
  TabView,
  type SceneRendererProps,
  type TabViewProps,
} from "react-native-tab-view";
import { TabList } from "./TabList";
import { TabsContext } from "./TabsContext";
import type { TabData } from "./types";

interface TabRootProps {
  children:
    | ReactElement<TabPanelProps>
    | (ReactElement<TabPanelProps> | ReactNode)[];
  initialTab?: string;
  style?: StyleProp<ViewStyle>;
  hideTabBar?: boolean;
  tabBarStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  onTabChange?: (name: string) => void;
  // Native-only: When tab changes, inputs will lose focus by default.
  keyboardDismissMode?: NonNullable<PagerViewProps["keyboardDismissMode"]>;
}

export interface TabsRef {
  index: number;
  setTab: (indexOrName: string | number) => void;
}

const renderTabBar: TabViewProps<TabData>["renderTabBar"] = (props) => (
  <TabList {...props} />
);

const renderNoTabBar = () => null;

export const TabRoot = memo(
  forwardRef<TabsRef, TabRootProps>(function TabRoot(
    {
      children,
      initialTab,
      style,
      hideTabBar,
      tabBarStyle,
      disabled,
      onTabChange,
      keyboardDismissMode,
    },
    ref,
  ) {
    const { routes, renderScene } = useMemo(() => {
      const childrenArr = Children.toArray(children).filter(
        (child): child is ReactElement<TabPanelProps> => {
          return (
            typeof child === "object" &&
            !!child &&
            "props" in child &&
            !!(child as ReactElement<TabPanelProps>).props?.name
          );
        },
      );

      const routes = childrenArr.map(
        (child): TabData => ({
          key: child.props.name,
          title: child.props.title,
          tabTrailing: child.props.tabTrailing,
        }),
      );

      const renderScene = ({
        route,
      }: SceneRendererProps & { route: TabData }) => {
        const index = routes.findIndex((r) => r.key === route.key);
        return childrenArr[index];
      };

      return {
        routes,
        renderScene,
      };
    }, [children]);

    const [index, setIndex] = useState(
      initialTab ? routes.findIndex((r) => r.key === initialTab) : 0,
    );

    useImperativeHandle(
      ref,
      () => ({
        index,
        setTab(indexOrName) {
          let changingIndex: number;
          if (typeof indexOrName === "number") {
            changingIndex = indexOrName;
          } else {
            changingIndex = routes.findIndex((r) => r.key === indexOrName);
            if (index === -1) return;
          }
          const route = routes[changingIndex];
          if (!route) return;
          setIndex(changingIndex);
          onTabChange?.(route.key);
        },
      }),
      [routes, index, onTabChange],
    );

    const onIndexChange = useCallback(
      (newIndex: number) => {
        setIndex(newIndex);
        onTabChange?.(routes[newIndex].key);
      },
      [setIndex, routes, onTabChange],
    );

    const navigationState = useMemo(() => ({ index, routes }), [index, routes]);

    const contextValue = useMemo(
      () => ({ disabled, tabBarStyle }),
      [disabled, tabBarStyle],
    );

    return (
      <TabsContext.Provider value={contextValue}>
        <TabView
          navigationState={navigationState}
          renderScene={renderScene}
          onIndexChange={onIndexChange}
          renderTabBar={hideTabBar ? renderNoTabBar : renderTabBar}
          style={style}
          swipeEnabled={!disabled && Platform.OS !== "web"}
          keyboardDismissMode={keyboardDismissMode}
          animationEnabled={Platform.OS !== "web"}
        />
      </TabsContext.Provider>
    );
  }),
);

interface TabPanelProps extends Omit<TabData, "key"> {
  name: string;
  style?: StyleProp<ViewStyle>;
}

export const TabPanel: FC<PropsWithChildren<TabPanelProps>> = ({
  children,
  style,
}) => {
  return <View style={[styles.content, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  content: {
    width: "100%",
    height: "100%",
  },
});
