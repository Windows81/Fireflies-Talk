import { useTheme } from "@/styles";
import { useMemo } from "react";
import type React from "react";
import { Linking, Text, View, StyleSheet } from "react-native";
import { CitationIcon } from "../components/CitationIcon";
import { isFootnoteLabel } from "./citationHelpers";

type MarkdownNode = {
  key: string;
  attributes: { href?: string };
  children?: Array<{ content?: string }>;
};

const getNodeText = (node: MarkdownNode): string => {
  if (!node.children) return "";
  return node.children.map((c) => c.content ?? "").join("");
};

export const useCitationRules = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      link: (node: MarkdownNode, children: React.ReactNode) => {
        const text = getNodeText(node);
        const href = node.attributes.href ?? "";

        if (!isFootnoteLabel(text)) {
          return (
            <Text
              key={node.key}
              style={{ color: theme.colors.commandPrimaryDefault }}
              onPress={() => {
                if (href) Linking.openURL(href).catch(() => {});
              }}
            >
              {children}
            </Text>
          );
        }

        return (
          <View key={node.key} style={styles.inline}>
            <CitationIcon href={href} />
          </View>
        );
      },
    }),
    [theme.colors.commandPrimaryDefault],
  );
};

const styles = StyleSheet.create({
  inline: {
    flexDirection: "row",
    alignItems: "center",
  },
});
