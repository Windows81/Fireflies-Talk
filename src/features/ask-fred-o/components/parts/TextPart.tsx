import { Markdown } from "@/components/Markdown";
import { useTheme } from "@/styles";
import type { TextPartComponentProps } from "@firefliesai/fred-react";
import type { FC } from "react";
import { useMemo } from "react";
import { useAskFredOLinkHandler } from "../../helpers/useAskFredOLinkHandler";
import { askFredOMarkdownStyle } from "../markdown/askFredOMarkdownStyle";
import { normalizeFredFootnotes } from "../markdown/normalizeFredFootnotes";

export const TextPart: FC<TextPartComponentProps> = ({ part }) => {
  const theme = useTheme();
  const onLinkPress = useAskFredOLinkHandler();
  const markdownStyle = useMemo(() => askFredOMarkdownStyle(theme), [theme]);
  const markdown = useMemo(
    () => normalizeFredFootnotes(part.text ?? ""),
    [part.text],
  );

  if (!markdown) return null;

  return (
    <Markdown
      color="textPrimary"
      onLinkPress={onLinkPress}
      style={markdownStyle}
    >
      {markdown}
    </Markdown>
  );
};
