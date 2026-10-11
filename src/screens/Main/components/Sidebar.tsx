import { IconLogoText } from "@/assets/svg";
import { Separator } from "@/components/Separator";
import { Text } from "@/components/Typography";
import { usePaywallConfig } from "@/features/billing";
import * as NativeCode from "@/modules/native-code";
import { createStyles, useTheme } from "@/styles";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { FC } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinkPressable } from "./LinkPressable";
import { FOOTER_ITEMS, SECONDARY_ITEMS } from "./sidebarItems";
import type { TabButtonProps } from "./utils";
import { getTabButtonProps } from "./utils";

const SidebarButton: FC<
  TabButtonProps & {
    externalUrl?: string;
  }
> = ({ title, focused, Icon, name, externalUrl, onPress, onLongPress }) => {
  const theme = useTheme();

  const { hidePaidFeatures } = usePaywallConfig();

  const node = (
    <View style={[styles.button, focused && styles.buttonFocused(theme)]}>
      <Icon
        width={18}
        height={18}
        color={
          focused
            ? theme.colors.commandPrimaryDefault
            : theme.colors.commandNeutralDefault
        }
      />
      <Text color={focused ? "commandPrimaryDefault" : "commandNeutralDefault"}>
        {title}
      </Text>
    </View>
  );

  if (hidePaidFeatures && externalUrl) {
    return (
      <Pressable
        onPress={() => NativeCode.openInBrowser(externalUrl)}
        aria-label={title}
      >
        {node}
      </Pressable>
    );
  }

  return (
    <LinkPressable
      href={name}
      onPress={onPress}
      onLongPress={onLongPress}
      aria-selected={focused}
      aria-label={title}
    >
      {node}
    </LinkPressable>
  );
};

export const Sidebar: FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const theme = useTheme();

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root(theme), { paddingTop: insets.top }]}>
      <View style={styles.logo}>
        <IconLogoText color={theme.colors.textPrimary} />
      </View>
      <ScrollView>
        {state.routes.map((route, index) => {
          return (
            <SidebarButton
              key={route.key}
              {...getTabButtonProps(
                state,
                navigation,
                descriptors,
                route,
                index,
              )}
            />
          );
        })}
        <Separator style={styles.separator} />
        {SECONDARY_ITEMS.map((item) => (
          <SidebarButton key={item.name} {...item} />
        ))}
        <View style={styles.separator} />
        {FOOTER_ITEMS.map((item) => (
          <SidebarButton key={item.name} {...item} />
        ))}
      </ScrollView>
    </View>
  );
};

export const SIDEBAR_WIDTH = 224;

const styles = createStyles({
  root: (theme) => ({
    borderRightWidth: 1,
    borderRightColor: theme.colors.borderStaticSubtle,
    width: SIDEBAR_WIDTH,
    backgroundColor:
      theme.name === "dark"
        ? theme.colors.layerStrong
        : theme.colors.layerBrandLight1,
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
  }),
  logo: {
    paddingVertical: 24,
    alignItems: "center",
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "flex-start",
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  buttonFocused: (theme) => ({
    backgroundColor: theme.colors.interactiveSecondaryDefault,
  }),
  section: (theme) => ({
    borderBottomColor: theme.colors.borderStaticSubtle,
    borderBottomWidth: 1,
    paddingVertical: 16,
  }),
  separator: {
    marginVertical: 16,
  },
});
