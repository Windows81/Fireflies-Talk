import type { MarkdownStyle } from "@/components/Markdown";
import { vars } from "@/styles";

// Notepad summary headings are bold body text, not larger heading typography.
const boldBodyHeading = {
  ...vars.typography.body1LongRegular,
  fontWeight: "700" as const,
  marginBottom: 16,
};

export const notepadSummaryMarkdownStyle: Partial<MarkdownStyle> = {
  heading1: boldBodyHeading,
  heading2: boldBodyHeading,
  heading3: boldBodyHeading,
  heading4: boldBodyHeading,
  heading5: boldBodyHeading,
  heading6: boldBodyHeading,
};
