import { IconMoreVertical, IconShare } from "@/assets/svg";
import { HeaderIconButton, HeaderSideContainer } from "@/components/Layout";
import { createStyles, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import type { Soundbite } from "@firefliesai/bites-ff.graphql-client";
import type { FC } from "react";
import { View } from "react-native";
import type { SvgProps } from "react-native-svg";
import {
  BITE_PRIVACY_OPTIONS,
  BITE_SINGLE_MULTIPLE_PRIVACY_MAP,
} from "src/features/bite/constants/privacy";

const headerShareWithPrivacyIcon = (PrivacyIcon: FC<SvgProps>) => {
  return function ShareWithPrivacyIcon(props: SvgProps) {
    const theme = useTheme();
    return (
      <>
        <IconShare {...props} style={styles.shareIcon} />
        <View style={styles.privacyIcon(theme)}>
          <PrivacyIcon
            width={10}
            height={10}
            color={theme.colors.textMuted}
            strokeWidth={3}
          />
        </View>
      </>
    );
  };
};

export const HeaderRight: FC<{
  bite: Soundbite;
  openShare: () => void;
  openMenu: () => void;
}> = ({ openShare, openMenu, bite }) => {
  const BITE_PRIVACY_OPTION = BITE_PRIVACY_OPTIONS.find(
    (option) =>
      BITE_SINGLE_MULTIPLE_PRIVACY_MAP[option.value].join(" ") ===
      bite.privacies?.join(" "),
  );

  return (
    <HeaderSideContainer>
      <HeaderIconButton
        Icon={
          BITE_PRIVACY_OPTION?.Icon
            ? headerShareWithPrivacyIcon(BITE_PRIVACY_OPTION.Icon)
            : IconShare
        }
        label="Share"
        onPress={() => {
          openShare();
          tracker.track(TRACKING_EVENTS.SHARE_DIALOG_OPENED, {
            type: "soundbite",
            from: "screen/header",
            id: bite.id,
            privacy: bite.privacies?.join(" "),
          });
        }}
      />
      <HeaderIconButton
        Icon={IconMoreVertical}
        label="More"
        onPress={openMenu}
      />
    </HeaderSideContainer>
  );
};

const styles = createStyles({
  shareIcon: {
    marginBottom: 2,
    marginRight: 2,
  },
  privacyIcon: (theme) => ({
    position: "absolute",
    right: 4,
    bottom: 4,
    borderRadius: 9999,
    padding: 2,
    backgroundColor: theme.colors.layerDefault,
  }),
});
