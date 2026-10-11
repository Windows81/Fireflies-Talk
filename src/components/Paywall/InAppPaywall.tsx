import {
  IconActivity,
  IconAiExpand,
  IconFileText,
  IconLayers,
  IconLogo,
  IconSparkle2,
  IconVideo,
  IconX,
} from "@/assets/svg";
import type { Theme } from "@/styles";
import { createStyles, useTheme, vars } from "@/styles";
import type { Tier } from "@firefliesai/payments-ff.utils";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useEffectEvent, type FC, type ReactNode } from "react";
import { ScrollView, View } from "react-native";
import type { SvgProps } from "react-native-svg";
import { TIER_PRICE_MAP } from "src/constants/billing";
import { IconButton } from "../Button";
import { Dialog } from "../Dialog";
import { Text } from "../Typography";
import { UpgradeButton } from "./UpgradeButton";

const FEATURE_ICON_SIZE = 28;

const FEATURES: {
  title: string;
  color: keyof Theme["colors"];
  backgroundColor: keyof Theme["colors"];
  Icon: FC<SvgProps>;
}[] = [
  {
    title: "Unlimited Transcriptions",
    color: "rainbowStaticPurpleText",
    backgroundColor: "rainbowStaticPurpleSubtle",
    Icon: IconAiExpand,
  },
  {
    title: "Unlimited AI Summaries",
    color: "informationStaticYellowText",
    backgroundColor: "rainbowStaticYellowSubtle",
    Icon: IconFileText,
  },
  {
    title: "AI Skills and Ask Fred",
    color: "rainbowStaticPinkText",
    backgroundColor: "rainbowStaticPinkSubtle",
    Icon: IconSparkle2,
  },
  {
    title: "Record Meeting Video",
    color: "rainbowStaticIndigoText",
    backgroundColor: "rainbowStaticIndigoSubtle",
    Icon: IconVideo,
  },
  {
    title: "Conversation Intelligence",
    color: "rainbowStaticCyanText",
    backgroundColor: "rainbowStaticCyanSubtle",
    Icon: IconActivity,
  },
  {
    title: "100+ Integrations & much more",
    color: "rainbowStaticTealText",
    backgroundColor: "rainbowStaticGreenSubtle",
    Icon: IconLayers,
  },
];

export function InAppPaywallModal({
  title,
  description,
  pwl,
  forAskFred,
  isOpen,
  onClose,
  onUpgradePress,
  minTier,
  isPaidUser,
  header,
  onOpen,
}: {
  title: string;
  description?: string;
  pwl?: string;
  forAskFred?: boolean;
  isOpen: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  onUpgradePress?: () => void;
  minTier: Tier | null;
  // if paid user, we do not show feature list.
  isPaidUser?: boolean;
  header?: ReactNode;
}) {
  const theme = useTheme();

  const stableOnOpen = useEffectEvent(() => onOpen?.());

  useEffect(() => {
    if (isOpen) {
      stableOnOpen();
    }
  }, [isOpen]);

  return (
    <Dialog.Root isOpen={isOpen} close={onClose} variant="bottomSheet">
      <LinearGradient
        style={styles.root}
        colors={
          isPaidUser
            ? [
                `${theme.colors.layerDefault}00`,
                `${theme.colors.rainbowStaticPurpleSolid}42`,
              ]
            : [theme.colors.layerPaywallWarm, theme.colors.layerDefault]
        }
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        {onClose && (
          <View style={styles.closeButton}>
            <IconButton
              Icon={IconX}
              onPress={onClose}
              label="Close"
              variant="neutralTransparent"
            />
          </View>
        )}
        <View style={styles.topContainer}>
          {header || (
            <View style={styles.icon(theme)}>
              <IconLogo />
            </View>
          )}
          <View style={styles.headingTexts}>
            <Text variant="heading4Weight" textAlign="center">
              {title}
            </Text>
            {description && (
              <Text
                variant="body1LongRegular"
                color="textMuted"
                textAlign="center"
              >
                {description}
              </Text>
            )}
          </View>
        </View>
        {isPaidUser ? (
          <View style={{ flex: 1 }} />
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.featureContainer}
          >
            <View style={styles.features(theme)}>
              {FEATURES.map(({ title, color, backgroundColor, Icon }) => (
                <View key={title} style={styles.feature}>
                  <View
                    style={{
                      width: FEATURE_ICON_SIZE,
                      height: FEATURE_ICON_SIZE,
                      borderRadius: 4,
                      backgroundColor: theme.colors[backgroundColor],
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Icon width={16} height={16} color={theme.colors[color]} />
                  </View>
                  <Text variant="body1Weight">{title}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
        <UpgradeButton
          forAskFred={forAskFred}
          pwl={pwl}
          minPrice={minTier && TIER_PRICE_MAP[minTier]}
          onPress={onUpgradePress}
        />
      </LinearGradient>
    </Dialog.Root>
  );
}

const styles = createStyles({
  root: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "auto",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  icon: (theme) => ({
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticDefault,
    width: 48,
    height: 48,
    alignSelf: "center",
    backgroundColor: theme.colors.layerDefault,
    justifyContent: "center",
    alignItems: "center",
    ...vars.elevations[1],
  }),
  topContainer: {
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 20,
    gap: 24,
  },
  headingTexts: {
    gap: 10,
  },
  featureContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  features: (theme) => ({
    backgroundColor: theme.colors.layerDefault,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    borderRadius: 12,
    padding: 16,
    gap: 24,
  }),
  feature: {
    flexDirection: "row",
    paddingVertical: 2,
    gap: 16,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
  },
});
