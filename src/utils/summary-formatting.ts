// Regular expressions for formatting different section types
const chapterRegex = /(#*\s*Chapter +\d+)/g;
const startWithEmoji =
  /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\uFE0F?\s\*\*[^*]+\*\*/gu;
const isListItem = /^(-|\d{1,2}\.)/;
const isHighlighted = /\*\*(.*?)\*\*/g;

// Helper functions
const makeItSubHeading = (str: string) => `##### ${str.replace(/^#+/, "")}`;
const makeItListItem = (str: string) =>
  str.trim().match(isListItem) ? str : `- ${str}`;

/**
 * Formats a section string by converting matching lines to subheadings
 * and other lines to list items
 */
const formatSection = (headingRegex: RegExp, str: string) =>
  str
    .split("\n")
    .filter((line) => line.trim())
    .map((line) =>
      line.match(headingRegex) ? makeItSubHeading(line) : makeItListItem(line),
    )
    .join("\n");

/**
 * Formats section content based on the section key/type.
 * @param sectionKey - The section key (e.g., 'OUTLINE', 'SHORTHAND_BULLET', 'ACTION_ITEMS')
 * @param content - The raw section content to format
 * @returns The formatted section content
 */
export const formatSectionContent = (
  sectionKey: string,
  content: string,
): string => {
  if (!content || content.length < 5) {
    return content;
  }

  switch (sectionKey) {
    case "OUTLINE":
      return formatSection(chapterRegex, content);
    case "SHORTHAND_BULLET":
      return formatSection(startWithEmoji, content);
    case "ACTION_ITEMS":
      return formatSection(isHighlighted, content);
    default:
      // For other sections (FREE_STYLE_NOTES, OVERVIEW, etc.), return as-is
      return content;
  }
};

// Constants
export const KEY_TAKEAWAYS_KEY = "KEY_TAKEAWAYS_OVERVIEW";

const keyTitleMap: Record<string, string> = {
  SHORTHAND_BULLET: "Notes",
  FREE_STYLE_NOTES: "Summary",
};

/**
 * Transforms a raw section key to its display format
 * @param key - Raw section key (e.g., 'SHORTHAND_BULLET')
 * @param variant - Optional variant (e.g., 'KEY_TAKEAWAYS')
 * @returns Transformed key (e.g., 'Notes' or 'KEY_TAKEAWAYS_OVERVIEW')
 */
export const transformSectionKey = (key: string, variant?: string): string => {
  if (variant === "KEY_TAKEAWAYS") {
    return KEY_TAKEAWAYS_KEY;
  }
  return (
    keyTitleMap[key] ||
    key.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
};
