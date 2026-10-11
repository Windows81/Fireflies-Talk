import { type FC } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { IconVideo } from "@/assets/svg";
import { getWebConfIcon } from "@/constants";
import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";

interface MeetingBannerLogoProps {
  url?: string | null;
}

/** Conferencing-platform logo tile shared across banner cards. */
export const MeetingBannerLogo: FC<MeetingBannerLogoProps> = ({ url }) => {
  const webConfIcon = getWebConfIcon(url ?? undefined);

  return (
    <View style={styles.logo}>
      {webConfIcon ? (
        <Image
          source={webConfIcon.src}
          alt={webConfIcon.name}
          style={styles.logoIcon}
        />
      ) : (
        <IconVideo width={20} height={20} color={DESKTOP_THEME.grey500} />
      )}
    </View>
  );
};

const styles = createStyles({
  logo: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: DESKTOP_THEME.grey950,
    alignItems: "center",
    justifyContent: "center",
  },
  logoIcon: {
    width: 20,
    height: 20,
  },
});
