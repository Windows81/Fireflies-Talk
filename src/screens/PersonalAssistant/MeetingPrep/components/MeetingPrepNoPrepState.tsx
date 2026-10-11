import { IconFileText } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import { GLOBAL } from "@/styles/color";

export const MeetingPrepNoPrepState: FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.root}>
      <View style={styles.iconContainer(theme)}>
        <IconFileText width={28} height={28} color={GLOBAL.purple300} />
      </View>
      <View style={styles.texts}>
        <Text variant="body1Weight" color="textSecondary" style={styles.text}>
          No prep for this meeting yet
        </Text>
        <Text
          variant="body2Regular"
          color="textMuted"
          style={[styles.text, styles.subtitle]}
        >
          You can still get key talking points, follow-ups and more in seconds
          with AskFred.
        </Text>
      </View>
    </View>
  );
};

const styles = createStyles({
  root: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingVertical: 40,
    alignSelf: "stretch",
  },
  iconContainer: (theme) => ({
    width: 56,
    height: 56,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.interactiveSecondaryDefault,
  }),
  texts: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  text: {
    textAlign: "center",
  },
  subtitle: {
    paddingHorizontal: 40,
  },
});
