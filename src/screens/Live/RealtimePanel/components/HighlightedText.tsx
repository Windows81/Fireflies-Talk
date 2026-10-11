import { Text } from "@/components/Typography";
import { useTheme } from "@/styles";
import { type ComponentProps, type FC, useMemo } from "react";
import { Text as RNText } from "react-native";

type TextProps = ComponentProps<typeof Text>;

type Segment = { text: string; isMatch: boolean };

// Split `text` into matched/unmatched runs for every case-insensitive
// occurrence of `query`. An empty query yields a single unmatched run.
const splitByQuery = (text: string, query: string): Segment[] => {
  const trimmed = query.trim();
  if (!trimmed) return [{ text, isMatch: false }];

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const segments: Segment[] = [];
  let from = 0;
  let index = lowerText.indexOf(lowerQuery, from);

  while (index !== -1) {
    if (index > from) {
      segments.push({ text: text.slice(from, index), isMatch: false });
    }
    segments.push({
      text: text.slice(index, index + lowerQuery.length),
      isMatch: true,
    });
    from = index + lowerQuery.length;
    index = lowerText.indexOf(lowerQuery, from);
  }

  if (from < text.length) {
    segments.push({ text: text.slice(from), isMatch: false });
  }
  return segments;
};

/** Renders `text`, highlighting every occurrence of `query`. */
export const HighlightedText: FC<
  { text: string; query: string } & Pick<
    TextProps,
    "variant" | "color" | "style" | "numberOfLines"
  >
> = ({ text, query, ...textProps }) => {
  const theme = useTheme();
  const segments = useMemo(() => splitByQuery(text, query), [text, query]);

  return (
    <Text {...textProps}>
      {segments.map((segment, index) =>
        segment.isMatch ? (
          <RNText
            key={index}
            style={{
              backgroundColor: theme.colors.rainbowStaticPurpleSubtle,
              color: theme.colors.rainbowStaticPurpleText,
            }}
          >
            {segment.text}
          </RNText>
        ) : (
          segment.text
        ),
      )}
    </Text>
  );
};
