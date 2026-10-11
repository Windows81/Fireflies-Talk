/**
 * The collapsed copy, or undefined when the text already fits. Cuts on the
 * character budget and on hard line breaks, since a break ends a rendered line
 * no matter how few characters preceded it.
 */
export const collapseDictationText = (
  text: string,
  budget: number,
  maxLines: number,
): string | undefined => {
  const lines = text.split("\n");
  const byBreaks =
    lines.length > maxLines ? lines.slice(0, maxLines).join("\n") : undefined;
  const candidate = byBreaks ?? text;
  if (candidate.length <= budget) return byBreaks?.trimEnd();
  return candidate.slice(0, budget).trimEnd();
};
