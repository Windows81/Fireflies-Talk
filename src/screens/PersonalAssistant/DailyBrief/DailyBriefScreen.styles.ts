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
  headerContainer: (theme) => ({
    paddingTop: 8,
    backgroundColor: theme.colors.layerDefault,
  }),
  buttonsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
  },
  selectedButton: (theme) => ({
    backgroundColor: theme.colors.interactiveSecondaryDefault,
    borderColor: theme.colors.borderStaticBrand,
    ...vars.elevations[2],
  }),
  unselectedButton: {
    ...vars.elevations[2],
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  meetingCountLink: {
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
  },
  copyLinkButton: {
    padding: 4,
    borderRadius: 6,
  },
  separatorLine: (theme) => ({
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.borderStaticDefault,
  }),
  briefItem: {
    paddingVertical: 16,
    gap: 8,
  },
  briefBody: {
    paddingHorizontal: 20,
  },
  feedback: {
    marginTop: 8,
    marginBottom: 24,
  },
});
