import { Text, type TextProps } from "@/components/Typography";
import type { Theme } from "@/styles";
import { Fragment, type FC } from "react";

type TextColor = keyof Theme["colors"];

const EM_SEGMENT = /<em>([\s\S]*?)<\/em>/g;

interface Segment {
  text: string;
  match: boolean;
}

const parseSegments = (sentence: string): Segment[] => {
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  EM_SEGMENT.lastIndex = 0;
  while ((match = EM_SEGMENT.exec(sentence)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        text: sentence.slice(lastIndex, match.index),
        match: false,
      });
    }
    segments.push({ text: match[1], match: true });
    lastIndex = EM_SEGMENT.lastIndex;
  }
  if (lastIndex < sentence.length) {
    segments.push({ text: sentence.slice(lastIndex), match: false });
  }
  return segments;
};

/**
 * Renders a server highlight sentence ("... <em>term</em> ...") with the matched
 * terms emphasized in the brand color.
 */
export const HighlightedText: FC<{
  sentence: string;
  color?: TextColor;
  highlightColor?: TextColor;
  numberOfLines?: number;
  variant?: TextProps["variant"];
  style?: TextProps["style"];
}> = ({
  sentence,
  color = "textMuted",
  highlightColor = "textBrand",
  numberOfLines,
  variant = "body2Regular",
  style,
}) => {
  return (
    <Text
      color={color}
      variant={variant}
      numberOfLines={numberOfLines}
      style={style}
    >
      {parseSegments(sentence).map((segment, index) =>
        segment.match ? (
          <Text key={index} color={highlightColor} variant="label2Weight">
            {segment.text}
          </Text>
        ) : (
          <Fragment key={index}>{segment.text}</Fragment>
        ),
      )}
    </Text>
  );
};
