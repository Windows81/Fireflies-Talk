import { createStyles, useTheme, vars } from "@/styles";
import { isDesktop } from "@/utils/device";
import { LinearGradient } from "expo-linear-gradient";
import { type FC, type ReactNode } from "react";
import { View } from "react-native";
import type { SvgProps } from "react-native-svg";
import { Text } from "../Typography";
import { UpgradeButton } from "./UpgradeButton";

export const PaywallContent: FC<{
  title: string;
  description?: string;
  header?: ReactNode;
  pwl?: string;
  forAskFred?: boolean;
  minPrice?: number | null;
  HeaderIcon?: FC<SvgProps>;
  onUpgradePress?: () => void;
}> = ({
  title,
  HeaderIcon,
  description,
  pwl,
  header,
  minPrice = 10,
  forAskFred,
  onUpgradePress,
}) => {
  const theme = useTheme();

  return (
    <LinearGradient
      colors={[
        `${theme.colors.layerDefault}00`,
        `${theme.colors.rainbowStaticPurpleSolid}42`,
      ]}
      style={[styles.root(theme), styles.rootStatic]}
    >
      {header}
      {HeaderIcon && (
        <View style={styles.paywallHeaderIcon(theme)}>
          <HeaderIcon
            width={20}
            height={20}
            color={theme.colors.informationStaticGreenSolid}
            fill={theme.colors.informationStaticGreenSolid}
          />
        </View>
      )}
      <View style={styles.details}>
        <Text variant="heading4Weight" style={styles.centeredText}>
          {title}
        </Text>
        {description && (
          <Text
            variant="body2LongRegular"
            color="textMuted"
            style={styles.centeredText}
          >
            {description}
          </Text>
        )}
      </View>
      <UpgradeButton
        onPress={onUpgradePress}
        pwl={pwl}
        forAskFred={forAskFred}
        minPrice={minPrice}
      />
    </LinearGradient>
  );
};

const styles = createStyles({
  root: (theme) => ({
    borderColor: theme.colors.layerDefault,
    borderWidth: isDesktop ? 0 : 1,
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
    alignItems: "center",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  }),
  rootStatic: {
    height: "100%",
    justifyContent: "center",
    paddingTop: 0,
    paddingBottom: 40,
  },
  headerIconContainer: {
    marginBottom: 32,
    marginTop: 12,
    flexDirection: "row",
  },
  headerIcon: {
    width: 68,
    height: 68,
    borderRadius: 4,
    alignItems: "center",
    marginHorizontal: 6,
    justifyContent: "center",
  },
  featuresContainer: (theme) => ({
    width: "100%",
    backgroundColor: theme.colors.layerBrandLight1,
    borderRadius: 8,
    padding: 20,
    marginTop: 32,
    gap: 24,
  }),
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  details: {
    gap: 8,
    width: "100%",
  },
  upgradeButton: {
    width: "100%",
    marginBottom: 12,
    marginTop: 24,
  },
  upgradeButtonIcon: {
    marginRight: 8,
  },
  centeredText: {
    textAlign: "center",
  },
  paywallHeaderIcon: (theme) => ({
    padding: 12,
    borderRadius: 4,
    borderColor: theme.colors.borderStaticDefault,
    borderWidth: 1,
    marginBottom: 20,
    backgroundColor: theme.colors.layerDefault,
    ...vars.elevations[2],
  }),
});
