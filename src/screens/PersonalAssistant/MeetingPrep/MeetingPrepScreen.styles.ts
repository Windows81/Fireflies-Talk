import { type MarkdownStyle } from "@/components/Markdown";
import { createStyles, FontStyles, vars, type Theme } from "@/styles";

export const getMarkdownStyle = (theme: Theme): Partial<MarkdownStyle> => {
  const markdownColor = { color: theme.colors.textSecondary };
  return {
    heading1: { ...FontStyles.title1Weight, ...markdownColor },
    heading2: { ...FontStyles.title2Weight, ...markdownColor },
    heading3: { ...FontStyles.title3Weight, ...markdownColor },
    strong: { ...FontStyles.body2LongWeight, ...markdownColor },
    body: { ...FontStyles.body2LongRegular, ...markdownColor },
  };
};

export const styles = createStyles({
  root: {
    flex: 1,
  },
  rootContent: {
    paddingBottom: 64,
  },
  stickyHeader: (theme) => ({
    backgroundColor: theme.colors.layerDefault,
  }),
  stickyHeaderBorder: (theme) => ({
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderStaticDefault,
  }),
  headerContainer: (theme) => ({
    paddingTop: 8,
    backgroundColor: theme.colors.layerDefault,
  }),
  buttonsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 20,
  },
  selectedButton: (theme) => ({
    backgroundColor: theme.colors.interactiveSecondaryDefault,
    borderColor: theme.colors.borderStaticBrand,
    ...vars.elevations[2],
  }),
  unselectedButton: {
    ...vars.elevations[2],
  },
  meetingListContent: {
    paddingHorizontal: 20,
    gap: 12,
    paddingTop: 12,
    paddingBottom: 4,
  },
  separator: (theme) => ({
    height: 1,
    backgroundColor: theme.colors.borderStaticDefault,
    marginTop: 12,
  }),
  sourceHeader: {
    gap: 8,
    paddingVertical: 12,
  },
  sourceRow: (theme) => ({
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.layerBrandLight1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  }),
  sourceTitle: {
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
  },
  sourceTitlePressable: {
    maxWidth: "55%",
  },
  prepContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  bulletList: {
    gap: 16,
  },
  bulletItem: {
    flexDirection: "row",
    gap: 10,
  },
  bulletEmoji: {
    fontSize: 16,
    lineHeight: 24,
  },
  bulletText: {
    flex: 1,
    gap: 2,
  },
  tasksSection: {
    gap: 16,
    paddingTop: 24,
  },
  tasksSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  feedback: {
    marginTop: 24,
  },
});
