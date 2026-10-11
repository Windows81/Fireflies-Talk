import { Breakpoint, createStyles } from "@/styles";

export const meetingCardStyles = createStyles({
  root: {
    flexDirection: "column",
    paddingTop: 20,
    paddingBottom: 24,
    justifyContent: "center",
    gap: 16,
    alignSelf: "stretch",
    width: "100%",
  },
  content: (theme) => ({
    paddingLeft: theme.breakpoint === Breakpoint.Small ? 0 : 48,
    flexDirection: "column",
    justifyContent: "center",
    gap: 8,
    alignSelf: "stretch",
  }),
});
