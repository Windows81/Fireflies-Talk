/**
 * Message content helpers for fred-react message parts
 * Centralized utilities for handling message content extraction and formatting
 */

import type {
  ThreadMessageAnswerPart,
  ThreadMessageQueryPart,
} from "@firefliesai/fred-client";

/**
 * Extract text content from message parts array
 * Handles text parts and safely ignores non-text parts
 * @param parts - Array of message parts from fred-react
 * @returns Combined text content as a string
 */
export const getTextContent = (
  parts: (ThreadMessageAnswerPart | ThreadMessageQueryPart)[] | undefined,
): string => {
  if (!parts || !Array.isArray(parts)) return "";

  return parts
    .map((part) => {
      // Handle text parts
      if (part.type === "text" && typeof part.text === "string") {
        return part.text;
      }

      // Future: Handle other part types
      // if (part.type === "attachment") { return "[Attachment]"; }
      // if (part.type === "mention") { return `@${part.mention?.name}`; }

      // Ignore unknown part types for now
      return "";
    })
    .join("");
};

/**
 * Format answer parts for display
 * Alias for getTextContent with semantic naming for answer context
 */
export const formatAnswerParts = getTextContent;

/**
 * Extract text from query parts (alias for consistency)
 */
export const getQueryText = getTextContent;

/**
 * Remove context and template markers from user queries for display
 * Strips [CONTEXT_START]...[CONTEXT_END] and [TEMPLATE_START]...[TEMPLATE_END] blocks
 * @param query - Raw query string with potential context/template markers
 * @returns Clean query string for display
 */
export const parseUserDisplayContent = (query: string): string => {
  if (!query) return "";

  let cleaned = query.replace(
    /\[CONTEXT_START\][\s\S]*?(?:\[CONTEXT_END\]|$)/g,
    "",
  );
  cleaned = cleaned.replace(
    /\[TEMPLATE_START\][\s\S]*?(?:\[TEMPLATE_END\]|$)/g,
    "",
  );
  cleaned = cleaned.replace(
    /\[TEMPLATE_DESCRIPTION_START\][\s\S]*?(?:\[TEMPLATE_DESCRIPTION_END\]|$)/g,
    "",
  );

  return cleaned.trim();
};

const TEMPLATE_BLOCK_REGEX =
  /\[TEMPLATE_DESCRIPTION_START\]([\s\S]*?)(?:\[TEMPLATE_DESCRIPTION_END\]|$)/;

/**
 * Extract content between [TEMPLATE_START] and [TEMPLATE_END] for tooltip.
 * Truncates to at most 3 lines.
 */
export const getTemplateTooltipContent = (query: string): string => {
  if (!query) return "";
  const match = query.match(TEMPLATE_BLOCK_REGEX);
  if (!match) return "";
  const content = match[1].trim();
  if (!content) return "";
  const lines = content.split(/\n/);
  return lines.slice(0, 3).join("\n").trim();
};

/**
 * Check if message parts contain only text
 * Useful for determining if special handling is needed
 */
export const isTextOnlyContent = (
  parts: ThreadMessageAnswerPart[] | undefined,
): boolean => {
  if (!Array.isArray(parts)) return false;
  return parts.every((part) => part.type === "text");
};

/**
 * Get a preview of message content
 * Useful for notifications or summaries
 */
export const getContentPreview = (
  parts: ThreadMessageAnswerPart[] | undefined,
  maxLength: number = 100,
): string => {
  const text = getTextContent(parts);

  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength - 3) + "...";
};
