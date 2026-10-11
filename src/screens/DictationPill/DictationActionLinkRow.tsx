import { IconArrowUpRight } from "@/assets/svg";
import type { Theme } from "@/styles";
import type { FC } from "react";
import { Pressable, Text, View } from "react-native";
import type { ActionLink } from "./dictationActionLinks";
import { panelStyles } from "./dictationActionPanelStyles";
import { webkitNoDrag } from "./dictationPillStyles";

/** Where the run put things, named for the destination rather than the URL. */
export const DictationActionLinkRow: FC<{
  links: ActionLink[];
  theme: Theme;
  onOpen: (url: string) => void;
}> = ({ links, theme, onOpen }) => (
  <View style={panelStyles.panelLinks}>
    {links.map((link) => (
      <Pressable
        key={link.url}
        testID="no-drag"
        accessibilityRole="link"
        accessibilityLabel={`Open ${link.label}`}
        onPress={() => onOpen(link.url)}
        style={[panelStyles.panelLink, webkitNoDrag]}
      >
        <IconArrowUpRight
          width={11}
          height={11}
          color={theme.colors.textPrimary}
        />
        <Text style={panelStyles.panelLinkLabel} numberOfLines={1}>
          {link.label}
        </Text>
      </Pressable>
    ))}
  </View>
);
