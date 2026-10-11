export const BULLET = "• ";

type Selection = { start: number; end: number };

/**
 * Rewrites an Enter press at [start, end] of `text` when the caret's line is
 * a bullet: an empty bullet exits the list (the "• " prefix is stripped), any
 * other bullet continues it with a fresh "• " on the next line. Returns null
 * on non-bullet lines, where the platform's own newline is correct. Inspects
 * the whole line (not just the text before the caret) so a caret inside the
 * "• " prefix isn't mistaken for an empty bullet, and clamps the split point
 * past the prefix so Enter there can't duplicate or break the bullet.
 */
export const applyBulletEnter = (
  text: string,
  start: number,
  end: number,
): { text: string; caret: number } | null => {
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const lineEnd = text.indexOf("\n", end);
  const fullLine = text.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
  if (!fullLine.startsWith(BULLET)) return null;

  if (fullLine === BULLET) {
    return {
      text: text.slice(0, lineStart) + text.slice(lineStart + BULLET.length),
      caret: lineStart,
    };
  }

  const splitAt = Math.max(start, lineStart + BULLET.length);
  const inserted = `\n${BULLET}`;
  return {
    text:
      text.slice(0, splitAt) + inserted + text.slice(Math.max(end, splitAt)),
    caret: splitAt + inserted.length,
  };
};

/**
 * Detects that `next` is exactly `prev` with the selection replaced by a
 * single newline — a native Enter press — and returns the replaced range in
 * `prev`. Platforms disagree on whether the tracked caret is pre-insert
 * (Android reports the text change first) or already post-insert (iOS moves
 * the selection first), so both interpretations are tried; each is validated
 * by exact string equality, so a mismatch (autocorrect, paste, IME rewrite)
 * returns null and never corrupts text.
 */
export const detectEnterInsert = (
  prev: string,
  next: string,
  caret: Selection,
): Selection | null => {
  const tryAt = (start: number): Selection | null => {
    const end = start + prev.length - next.length + 1;
    if (start < 0 || end < start || end > prev.length) return null;
    if (next.charAt(start) !== "\n") return null;
    if (!next.startsWith(prev.slice(0, start))) return null;
    if (!next.endsWith(prev.slice(end))) return null;
    return { start, end };
  };

  return tryAt(caret.start) ?? tryAt(caret.start - 1);
};
