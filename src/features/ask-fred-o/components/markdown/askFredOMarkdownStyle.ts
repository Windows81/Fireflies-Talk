import type { MarkdownStyle } from "@/components/Markdown";
import type { Theme } from "@/styles";
import { vars } from "@/styles";

export const askFredOMarkdownStyle = (
  theme: Theme,
): Partial<MarkdownStyle> => ({
  body: {
    ...vars.typography.body2LongRegular,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  strong: {
    ...vars.typography.body2Weight,
    fontSize: 14,
  },
  em: {
    ...vars.typography.body2Regular,
    fontSize: 14,
  },
  list_item: {
    marginBottom: 4,
  },
  heading1: {
    ...vars.typography.heading5Weight,
    marginTop: 12,
    marginBottom: 8,
  },
  heading2: {
    ...vars.typography.title1Weight,
    marginTop: 12,
    marginBottom: 8,
  },
  heading3: {
    ...vars.typography.title2Weight,
    marginTop: 12,
    marginBottom: 8,
  },
  heading4: {
    ...vars.typography.title3Weight,
    marginTop: 12,
    marginBottom: 8,
  },
  code_inline: {
    ...vars.typography.body3Regular,
    backgroundColor: theme.colors.layerMuted,
    color: theme.colors.textPrimary,
  },
  fence: {
    ...vars.typography.body3Regular,
    backgroundColor: theme.colors.layerMuted,
    color: theme.colors.textPrimary,
    borderWidth: 0,
    borderRadius: 8,
    padding: 12,
  },
  code_block: {
    ...vars.typography.body3Regular,
    backgroundColor: theme.colors.layerMuted,
    color: theme.colors.textPrimary,
    borderWidth: 0,
    borderRadius: 8,
    padding: 12,
  },
  link: {
    color: theme.colors.textBrand,
  },
  table: {
    borderWidth: 1,
    borderColor: theme.colors.borderStaticMuted,
    borderRadius: 8,
  },
  tr: {
    borderBottomWidth: 1,
    borderColor: theme.colors.borderStaticMuted,
    flexDirection: "row",
  },
  th: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.borderStaticMuted,
    padding: 6,
  },
  td: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.borderStaticMuted,
    padding: 6,
  },
  hr: {
    backgroundColor: theme.colors.borderStaticMuted,
  },
});
