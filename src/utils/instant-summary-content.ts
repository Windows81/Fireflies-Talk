import { formatSectionContent } from "@/utils/summary-formatting";

/** Transformed instant-summary section key (post-finish). */
export const INSTANT_SUMMARY_SECTION_KEY = "Summary";

export const INSTANT_SUMMARY_RAW_SECTION_KEY = "FREE_STYLE_NOTES";

export interface InstantSummaryContent {
  content: string | undefined;
  isCompleted: boolean;
}

/**
 * Resolves the instant-summary body from live section state. Prefers the
 * completed transformed section; while streaming, formats the raw key.
 */
export function getInstantSummaryContent(
  sectionContent: Record<string, string>,
  completedSections: Set<string>,
): InstantSummaryContent {
  const isCompleted = completedSections.has(INSTANT_SUMMARY_SECTION_KEY);

  let content: string | undefined;
  if (isCompleted) {
    content = sectionContent[INSTANT_SUMMARY_SECTION_KEY];
  } else {
    const rawContent = sectionContent[INSTANT_SUMMARY_RAW_SECTION_KEY];
    if (rawContent) {
      content = formatSectionContent(
        INSTANT_SUMMARY_RAW_SECTION_KEY,
        rawContent,
      );
    }
  }

  return { content, isCompleted };
}
