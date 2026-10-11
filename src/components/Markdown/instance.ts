import type { PluginSimple } from "markdown-it";
import { MarkdownIt } from "react-native-markdown-display";

// Neither underline nor the manual-note mark are part of CommonMark, so we
// tokenize their HTML-like wrappers into paired inline tokens that render as a
// dedicated node (see Markdown.tsx).
//   <u>…</u>   -> underline mark serialized by the summary editor (TipTap)
//   <mn>…</mn> -> sentences merged from the owner's desktop app notes
const INLINE_TAGS: { name: string; tag: string }[] = [
  { name: "underline", tag: "u" },
  { name: "manualNote", tag: "mn" },
];

const buildTagPlugin = ({
  name,
  tag,
}: {
  name: string;
  tag: string;
}): PluginSimple => {
  const open = `<${tag}>`;
  const close = `</${tag}>`;
  return (md) => {
    md.inline.ruler.before("html_inline", name, (state, silent) => {
      if (state.src.startsWith(open, state.pos)) {
        if (!silent) state.push(`${tag}_open`, tag, 1).markup = open;
        state.pos += open.length;
        return true;
      }
      if (state.src.startsWith(close, state.pos)) {
        if (!silent) state.push(`${tag}_close`, tag, -1).markup = close;
        state.pos += close.length;
        return true;
      }
      return false;
    });
  };
};

export const markdownItInstance = INLINE_TAGS.reduce(
  (md, config) => md.use(buildTagPlugin(config)),
  MarkdownIt({ typographer: true }),
);
