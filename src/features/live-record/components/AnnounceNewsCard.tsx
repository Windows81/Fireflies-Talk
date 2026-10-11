import { Text } from "@/components/Typography";
import { createStyles, useTheme, vars } from "@/styles";
import { IconClose, IconMic2 } from "@/assets/svg";
import { type ComponentType, type FC } from "react";
import { Platform, Pressable, View } from "react-native";
import type { SvgProps } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRecordPreferencesStore } from "../record-preference.store";

export type AnnounceNewsFeature = {
  Icon: ComponentType<SvgProps>;
  title: string;
  subtitle: string;
};

const WIDGET_FEATURE: AnnounceNewsFeature = {
  Icon: IconMic2,
  title: "Recording Widget",
  subtitle: "Start a recording from your home or lock screen in one tap.",
};

export const AnnounceNewsCard: FC<{
  feature?: AnnounceNewsFeature;
  onPress?: () => void;
}> = ({ feature = WIDGET_FEATURE, onPress }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const hasDismissed = useRecordPreferencesStore(
    (state) => state.hasDismissedWidgetAnnouncement,
  );
  const dismiss = useRecordPreferencesStore(
    (state) => state.dismissWidgetAnnouncement,
  );
  const { Icon, title, subtitle } = feature;

  if (hasDismissed) return null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.shadow,
        Platform.OS === "android" && { marginBottom: insets.bottom },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
      role="button"
    >
      <View style={styles.root}>
        <View style={styles.iconHalo(theme)}>
          <View style={styles.iconContainer}>
            <Icon
              width={22}
              height={22}
              color={vars.colors.purple400}
              strokeWidth={1.5}
            />
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              variant="body1Weight"
              color="textPrimary"
              style={styles.title}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
            <View style={styles.newBadge}>
              <Text variant="label3Weight" style={styles.newBadgeText}>
                NEW
              </Text>
            </View>
          </View>
          <Text
            variant="body2Regular"
            color="textSecondary"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {subtitle}
          </Text>
        </View>
        <Pressable
          onPress={dismiss}
          hitSlop={12}
          style={({ pressed }) => [
            styles.dismiss,
            pressed && styles.dismissPressed,
          ]}
          aria-label="Dismiss"
          role="button"
        >
          <IconClose width={16} height={16} color={theme.colors.textHint} />
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = createStyles({
  shadow: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 20,
    backgroundColor: "transparent",
    ...Platform.select({
      ios: {
        shadowColor: vars.colors.grey900,
        shadowOpacity: 0.04,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 2,
        shadowColor: vars.colors.grey900,
      },
      default: {
        boxShadow: `0px 2px 2px rgba(16, 24, 40, 0.04)`,
      },
    }),
  },
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    minHeight: 84,
    flexShrink: 0,
    borderRadius: 20,
    backgroundColor: vars.colors.grey50,
    borderWidth: 1,
    borderColor: vars.colors.grey100,
    overflow: "hidden",
  },
  iconHalo: (theme) => ({
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.layerDefault,
    padding: 4,
  }),
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: vars.colors.purple50,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flexShrink: 1,
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: vars.colors.teal300,
  },
  newBadgeText: {
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  dismiss: {
    alignSelf: "flex-start",
    padding: 4,
    borderRadius: 999,
  },
  dismissPressed: {
    backgroundColor: vars.colors.grey200,
  },
  pressed: {
    opacity: 0.7,
  },
});
