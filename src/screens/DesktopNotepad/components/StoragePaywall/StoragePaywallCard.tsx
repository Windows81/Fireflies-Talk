import { imageStoragePaywallBlur } from "@/assets/images";
import { IconAlertCircle } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import type { FC, ReactNode } from "react";
import { Image, StyleSheet, View } from "react-native";

const formatMinutes = (minutes: number) => minutes.toLocaleString("en-US");

const Message: FC<{
  title: ReactNode;
  description: string;
  descriptionColor: "textSecondary" | "textMuted";
}> = ({ title, description, descriptionColor }) => (
  <View style={styles.message}>
    {typeof title === "string" ? (
      <Text variant="body1Weight">{title}</Text>
    ) : (
      title
    )}
    <Text variant="body2Regular" color={descriptionColor}>
      {description}
    </Text>
  </View>
);

/**
 * The two-row card at the center of the storage paywall: the exhausted-limit
 * alert with an Upgrade CTA, and the alternative of freeing space by deleting
 * meetings.
 */
export const StoragePaywallCard: FC<{
  consumedMinutes: number;
  limitMinutes: number;
  /** False in builds where upgrading is not offered (app-store review, etc). */
  showUpgrade: boolean;
  onUpgrade: () => void;
  onReviewMeetings: () => void;
}> = ({
  consumedMinutes,
  limitMinutes,
  showUpgrade,
  onUpgrade,
  onReviewMeetings,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.root(theme)}>
      <View style={styles.alertRow}>
        {/* Ships pre-cropped and pre-blurred at the row's exact size, so it
            needs no scrim of its own. */}
        <Image
          source={imageStoragePaywallBlur}
          style={styles.artwork}
          resizeMode="cover"
        />
        <View style={styles.alertIcon}>
          <IconAlertCircle
            width={24}
            height={24}
            color={DESKTOP_THEME.amber400}
          />
        </View>
        <Message
          title={
            <Text variant="body1Weight">
              Storage limit exhausted{" "}
              <Text variant="body1Regular">
                ({formatMinutes(consumedMinutes)} mins consumed)
              </Text>
            </Text>
          }
          description={`You have exhausted your storage limit of ${formatMinutes(limitMinutes)} mins`}
          descriptionColor="textSecondary"
        />
        {showUpgrade && (
          <Button variant="primary" size="sm" onPress={onUpgrade}>
            Upgrade
          </Button>
        )}
      </View>

      <View style={styles.reviewRow}>
        <Message
          title="Or, delete your meetings"
          description="To free up storage, remove your meetings on the notebook"
          descriptionColor="textMuted"
        />
        <Button variant="outlined" size="sm" onPress={onReviewMeetings}>
          Review Meetings
        </Button>
      </View>
    </View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    width: 680,
    maxWidth: "100%",
    padding: 20,
    gap: 20,
    borderRadius: 16,
    backgroundColor: theme.colors.layerMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticDefault,
    overflow: "hidden",
  }),
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  artwork: {
    ...StyleSheet.absoluteFillObject,
    // Pin the asset so a tall source file cannot inflate the row on web
    // and leave the copy sitting low in leftover space.
    width: "100%",
    height: "100%",
  },
  alertIcon: {
    padding: 12,
    borderRadius: 8,
    // Translucent white lifts the icon off the artwork whatever pixels sit
    // behind it, which a solid surface token could not do.
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  message: {
    flex: 1,
    gap: 2,
    justifyContent: "center",
  },
});
