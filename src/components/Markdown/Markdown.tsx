import type { Theme } from "@/styles";
import { useTheme, vars } from "@/styles";
import type { ReactNode } from "react";
import { forwardRef, memo, useImperativeHandle, useMemo } from "react";
import type { TextStyle, ViewStyle } from "react-native";
import { Text } from "react-native";
import MarkdownDisplay from "react-native-markdown-display";
import { markdownItInstance } from "./instance";
import { markdownToHtml } from "./utils";

// The <u> and <mn> nodes are produced by our markdown-it plugins (see
// instance.ts); react-native-markdown-display has no built-in rules for them.
const markdownRules = {
  u: (node: { key: string }, children: ReactNode) => (
    <Text key={node.key} style={UNDERLINE_STYLE}>
      {children}
    </Text>
  ),
  mn: (
    node: { key: string },
    children: ReactNode,
    _parent: unknown,
    styles: Record<string, TextStyle>,
  ) => (
    <Text key={node.key} style={styles.manualNote}>
      {children}
    </Text>
  ),
};
const UNDERLINE_STYLE: TextStyle = { textDecorationLine: "underline" };

export interface MarkdownInstance {
  getHtml: () => string;
}

export const Markdown = memo(
  forwardRef<
    MarkdownInstance,
    {
      children: string;
      onLinkPress?: (url: string) => boolean;
      color?: keyof Theme["colors"];
      style?: Partial<MarkdownStyle>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rules?: Record<string, (...args: any[]) => React.ReactNode>;
    }
  >(function Markdown(
    { children, onLinkPress, color = "textPrimary", style: customStyle, rules },
    ref,
  ) {
    const theme = useTheme();
    const style = useMemo(() => {
      const baseStyles = getStyles(theme, color);
      for (const key of Object.keys(baseStyles) as Array<keyof MarkdownStyle>) {
        if (customStyle?.[key]) {
          // but in practice, they are already type checked individually
          baseStyles[key] = {
            ...baseStyles[key],
            ...customStyle[key],
          };
        }
      }
      return baseStyles;
    }, [theme, color, customStyle]);

    useImperativeHandle(ref, () => ({
      getHtml: () => markdownToHtml(children),
    }));

    const mergedRules = useMemo(
      () => ({ ...markdownRules, ...rules }),
      [rules],
    );

    return (
      <MarkdownDisplay
        mergeStyle={false}
        style={style}
        rules={mergedRules}
        markdownit={markdownItInstance}
        onLinkPress={onLinkPress}
      >
        {children}
      </MarkdownDisplay>
    );
  }),
);

// https://github.com/iamacup/react-native-markdown-display/blob/master/src/lib/styles.js
const getStyles = (
  theme: Theme,
  color: keyof Theme["colors"],
): MarkdownStyle => ({
  body: {
    ...vars.typography.body1LongRegular,
    color: theme.colors[color],
  },
  heading1: {
    ...vars.typography.heading3Weight,
    color: theme.colors[color],
    marginBottom: 16,
  },
  heading2: {
    ...vars.typography.heading4Weight,
    color: theme.colors[color],
    marginBottom: 16,
  },
  heading3: {
    ...vars.typography.heading5Weight,
    color: theme.colors[color],
    marginBottom: 16,
  },
  heading4: {
    ...vars.typography.title1Weight,
    color: theme.colors[color],
    marginBottom: 16,
  },
  heading5: {
    ...vars.typography.title2Weight,
    color: theme.colors[color],
    marginBottom: 16,
  },
  heading6: {
    ...vars.typography.title3Weight,
    color: theme.colors[color],
    marginBottom: 16,
  },
  hr: {
    backgroundColor: theme.colors.borderStaticDefault,
    height: 1,
  },
  // Inline marks set only their modifier so they inherit size/family/color from
  // the surrounding text. On web the font-family strings don't encode weight or
  // style, so bold/italic must be applied via fontWeight/fontStyle explicitly.
  strong: { fontWeight: "700" },
  em: { fontStyle: "italic" },
  s: { textDecorationLine: "line-through" },
  u: { textDecorationLine: "underline" },
  // Sentences merged from the owner's desktop app notes get a dotted underline.
  manualNote: {
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
    textDecorationColor: theme.colors.commandHintHover,
  },
  list_item: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  bullet_list_icon: {
    marginLeft: 10,
    marginRight: 10,
  },
  ordered_list_icon: {
    marginLeft: 10,
    marginRight: 10,
  },
  link: {
    color: theme.colors.commandPrimaryDefault,
  },
  paragraph: {
    marginBottom: 12,
    flexWrap: "wrap",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    width: "100%",
  },
  code_inline: {
    backgroundColor: theme.colors.layerSubtle,
    color: theme.colors[color],
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontFamily: "monospace",
  },
  code_block: {
    backgroundColor: theme.colors.layerSubtle,
    color: theme.colors[color],
    borderRadius: 8,
    padding: 12,
    fontFamily: "monospace",
  },
  fence: {
    backgroundColor: theme.colors.layerSubtle,
    color: theme.colors[color],
    borderRadius: 8,
    padding: 12,
    fontFamily: "monospace",
  },
  table: {
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    borderRadius: 3,
  },
  thead: {},
  tbody: {},
  tr: {
    borderBottomWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    flexDirection: "row",
  },
  th: {
    flex: 1,
    padding: 5,
  },
  td: {
    flex: 1,
    padding: 5,
  },
});

export type MarkdownStyle = {
  body: TextStyle;
  heading1: TextStyle;
  heading2: TextStyle;
  heading3: TextStyle;
  heading4: TextStyle;
  heading5: TextStyle;
  heading6: TextStyle;
  hr: ViewStyle;
  strong: TextStyle;
  em: TextStyle;
  s: TextStyle;
  u: TextStyle;
  manualNote: TextStyle;
  code_inline: TextStyle;
  code_block: TextStyle;
  fence: TextStyle;
  list_item: ViewStyle;
  bullet_list_icon: ViewStyle;
  ordered_list_icon: ViewStyle;
  link: TextStyle;
  paragraph: ViewStyle;
  table: ViewStyle;
  thead: ViewStyle;
  tbody: ViewStyle;
  tr: ViewStyle;
  th: ViewStyle;
  td: ViewStyle;
};
