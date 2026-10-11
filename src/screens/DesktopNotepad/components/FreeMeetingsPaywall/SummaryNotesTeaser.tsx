import { Text } from "@/components/Typography";
import type { Theme } from "@/styles";
import { createStyles, useTheme } from "@/styles";
import type { FC, PropsWithChildren } from "react";
import { View } from "react-native";
import { PaywallTeaser } from "./PaywallTeaser";

const SECTION_TITLE = "Design System Updates";

const POINTS = [
  {
    text: "Component library refresh discussed.",
    subpoints: [
      "New button and form field components finalized.",
      "Accessibility improvements identified.",
      "Documentation updates pending.",
    ],
  },
  {
    text: "Accessibility improvements reviewed.",
    subpoints: [
      "Color contrast issues identified.",
      "Keyboard navigation gaps noted.",
    ],
  },
];

const Bullet: FC<PropsWithChildren<{ theme: Theme }>> = ({
  theme,
  children,
}) => (
  <View style={styles.bullet}>
    <View style={styles.dot(theme)} />
    <Text variant="body1LongRegular" color="textMuted" style={styles.text}>
      {children}
    </Text>
  </View>
);

export const SummaryNotesTeaser: FC = () => {
  const theme = useTheme();

  return (
    <PaywallTeaser gap={20}>
      <Text variant="title2Weight" color="textMuted">
        {SECTION_TITLE}
      </Text>
      {POINTS.map((point) => (
        <View key={point.text} style={styles.point}>
          <Bullet theme={theme}>{point.text}</Bullet>
          <View style={styles.subpoints}>
            {point.subpoints.map((subpoint) => (
              <Bullet key={subpoint} theme={theme}>
                {subpoint}
              </Bullet>
            ))}
          </View>
        </View>
      ))}
    </PaywallTeaser>
  );
};

const styles = createStyles({
  point: {
    gap: 4,
  },
  subpoints: {
    paddingLeft: 20,
    gap: 4,
  },
  bullet: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  dot: (theme) => ({
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.textMuted,
    // Centers the dot on the first line of 28px copy.
    marginTop: 12,
  }),
  text: {
    flex: 1,
  },
});
