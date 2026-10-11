import { IconPlayOutline } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { playConsentAudio } from "@/features/audio-consent";
import { Logger } from "@/logger";
import { createStyles, useTheme } from "@/styles";
import { type FC, useCallback, useState } from "react";
import { Pressable } from "react-native";

const log = new Logger("ConsentSetup");

/** Plays the consent message once, so the user hears what they are turning on. */
export const ConsentAudioPreviewButton: FC = () => {
  const theme = useTheme();
  const [playing, setPlaying] = useState(false);

  const handlePress = useCallback(async () => {
    // A second press mid-message would overlap two copies of the same audio.
    if (playing) return;
    setPlaying(true);
    try {
      await playConsentAudio();
    } catch (error) {
      log.warn("Consent preview failed to play", { error });
    } finally {
      setPlaying(false);
    }
  }, [playing]);

  return (
    <Pressable
      onPress={handlePress}
      style={styles.root}
      aria-label="Play the consent message"
    >
      <IconPlayOutline
        width={16}
        height={16}
        color={theme.colors.commandHintDefault}
      />
      <Text variant="label3Weight" color="commandHintDefault">
        Consent
      </Text>
    </Pressable>
  );
};

const styles = createStyles({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
