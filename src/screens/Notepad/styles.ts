import { Breakpoint, createStyles } from "@/styles";

export const sharedStyles = createStyles({
  container: {
    paddingHorizontal: 24,
    maxWidth: 728,
    width: "100%",
    marginHorizontal: "auto",
    alignSelf: "center",
  },
  tabPanel: {
    width: "100%",
    height: "100%",
  },
});

export const layoutStyles = createStyles({
  side: (theme) => ({
    flexDirection: "column",
    ...(theme.breakpoint === Breakpoint.Large ? { width: 340 } : { flex: 1 }),
  }),
  sideLarge: (theme) => ({
    flexDirection: "column",
    ...(theme.breakpoint === Breakpoint.Large ? { width: 432 } : { flex: 1 }),
  }),
  sideTabs: (theme) => ({
    ...(theme.breakpoint === Breakpoint.Large
      ? { borderRightWidth: 1 }
      : { borderLeftWidth: 1 }),
    borderColor: theme.colors.borderStaticSubtle,
    padding: 8,
    gap: 12,
    width: 49,
  }),
});
