const SUPERSCRIPT_DIGITS = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];

const FOOTNOTE_DEFINITION =
  /^[ \t]*\[\^[^\]]+\]:.*(?:\r?\n)?(?:[ \t]+\S.*(?:\r?\n)?)*(?:[ \t]*\r?\n)*/gm;
const FOOTNOTE_REFERENCE = /\[\^([^\]]+)\]/g;
// Fenced blocks and inline spans are skipped so footnote-shaped tokens inside
// code (a negated character class such as [^abc]) survive untouched. A fence
// closes only on a standalone line of the same character and at least the
// opening length, so a fence sequence inside the block does not end it early.
const OPENING_FENCE = /^[ \t]{0,3}(`{3,}|~{3,})/;
const CLOSING_FENCE = /^[ \t]{0,3}(`{3,}|~{3,})[ \t]*\r?$/;
const INLINE_CODE = /(`[^`\n]*`)/g;

const toSuperscript = (value: number): string =>
  String(value)
    .split("")
    .map((digit) => SUPERSCRIPT_DIGITS[Number(digit)])
    .join("");

const rewriteSegment = (
  segment: string,
  labelNumbers: Map<string, number>,
): string =>
  segment
    .replace(FOOTNOTE_DEFINITION, "")
    .replace(FOOTNOTE_REFERENCE, (_match, label: string) => {
      const existing = labelNumbers.get(label);
      if (existing) return toSuperscript(existing);

      const next = labelNumbers.size + 1;
      labelNumbers.set(label, next);
      return toSuperscript(next);
    });

const rewriteOutsideInlineCode = (
  block: string,
  labelNumbers: Map<string, number>,
): string =>
  block
    .split(INLINE_CODE)
    .map((segment, index) =>
      index % 2 === 1 ? segment : rewriteSegment(segment, labelNumbers),
    )
    .join("");

const closes = (line: string, openFence: string): boolean => {
  const fence = CLOSING_FENCE.exec(line)?.[1];

  return (
    !!fence && fence[0] === openFence[0] && fence.length >= openFence.length
  );
};

export const normalizeFredFootnotes = (markdown: string): string => {
  if (!markdown) return markdown;

  const labelNumbers = new Map<string, number>();
  const output: string[] = [];
  let textLines: string[] = [];
  let openFence: string | null = null;

  const flushText = () => {
    if (!textLines.length) return;

    output.push(rewriteOutsideInlineCode(textLines.join("\n"), labelNumbers));
    textLines = [];
  };

  for (const line of markdown.split("\n")) {
    if (openFence) {
      output.push(line);
      openFence = closes(line, openFence) ? null : openFence;
      continue;
    }

    const opening = OPENING_FENCE.exec(line)?.[1];
    if (!opening) {
      textLines.push(line);
      continue;
    }

    flushText();
    openFence = opening;
    output.push(line);
  }
  flushText();

  return output.join("\n").trimEnd();
};
