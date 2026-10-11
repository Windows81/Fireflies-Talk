const MANUAL_NOTE_PRESENCE = /\(manual note\)/i;
const MANUAL_NOTE_MARKER = /\s*\(manual note\)/gi;
const BLOCK_PREFIX = /^(\s*(?:[-*+]\s+|\d+[.)]\s+|#{1,6}\s+)?)(.*)$/;

/**
 * The summary backend appends "(manual note)" to sentences merged from the
 * owner's desktop app notes. Strip that marker and wrap each affected block in
 * <mn>…</mn> so it renders with a dotted underline (see Markdown.tsx).
 */
export const wrapManualNotes = (content: string): string => {
  if (!MANUAL_NOTE_PRESENCE.test(content)) return content;

  return content
    .split("\n")
    .map((line) => {
      if (!MANUAL_NOTE_PRESENCE.test(line)) return line;

      const stripped = line.replace(MANUAL_NOTE_MARKER, "");
      // Keep leading indentation and any list/heading marker outside the wrapper
      // so the block still parses as markdown; underline only the visible text.
      const match = stripped.match(BLOCK_PREFIX);
      if (!match) return stripped;

      const [, prefix, rest] = match;
      if (!rest.trim()) return stripped;

      return `${prefix}<mn>${rest}</mn>`;
    })
    .join("\n");
};
