import { IconWarning } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { getTalkDisabledCopy } from "@/hooks/dictationDisabledCopy";
import { useDictationTalkPolicy } from "@/hooks/useDictationTalkPolicy";
import { useTurnOnFirefliesTalk } from "@/hooks/useTurnOnFirefliesTalk";
import { createStyles, useTheme, type Theme } from "@/styles";
import { GLOBAL } from "@/styles/color";
import type { FC } from "react";
import { View } from "react-native";

/**
 * The dictation pane's stand-in while Talk is off — the tab stays so the
 * account can see why it is gone, and (when the off is their own) turn it
 * back on without leaving the app.
 */
export const DictationDisabledBanner: FC = () => {
  const theme = useTheme();
  const { disabledByUser, disabledByTeam, isTeamAdmin } =
    useDictationTalkPolicy();
  const { turnOn, loading } = useTurnOnFirefliesTalk();
  const copy = getTalkDisabledCopy({
    disabledByUser,
    disabledByTeam,
    isTeamAdmin,
  });

  return (
    <View style={styles.banner(theme)}>
      <IconWarning
        width={20}
        height={20}
        color={GLOBAL.yellow600}
        style={styles.icon}
      />
      <View style={styles.text}>
        <Text variant="body3Weight" color="textPrimary">
          {copy.title}
        </Text>
        <Text variant="body2Regular" color="textSecondary">
          {copy.description}
        </Text>
      </View>
      {copy.canTurnOn && (
        <Button
          variant="outlined"
          size="sm"
          disabled={loading}
          onPress={turnOn}
          accessibilityLabel="Turn Fireflies Talk back on"
        >
          {copy.turnOnLabel}
        </Button>
      )}
    </View>
  );
};

const styles = createStyles({
  banner: (theme: Theme) => ({
    alignSelf: "stretch",
    width: "100%",
    minWidth: 0,
    maxWidth: 768,
    borderRadius: 12,
    backgroundColor: theme.colors.layerStrong,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  }),
  icon: {
    flexShrink: 0,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
