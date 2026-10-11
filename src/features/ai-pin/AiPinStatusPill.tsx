import { IconDownload } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { useOverlayBottomInset } from "@/utils/screen-type";
import { Pressable, View } from "react-native";
import type { AiPinControllerState } from "./types";

const OVERLAY_GAP = 12;

export function AiPinStatusPill({
  state,
  onPress,
}: {
  state: AiPinControllerState;
  onPress: () => void;
}) {
  const theme = useTheme();
  const bottom = useOverlayBottomInset() + OVERLAY_GAP;
  const sync = state.sync;
  if (!sync || sync.phase !== "downloading") return null;

  const progress =
    typeof sync.progress === "number" && Number.isFinite(sync.progress)
      ? Math.max(0, Math.min(sync.progress, 1))
      : undefined;
  const percentage =
    progress === undefined ? undefined : Math.round(progress * 100);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Syncing AI Pin${percentage === undefined ? "" : `, ${percentage}%`}. Open AI Pin details`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.root(theme),
        { bottom },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.icon(theme)}>
        <IconDownload width={17} height={17} color={theme.colors.textBrand} />
      </View>
      <View style={styles.copy}>
        <View style={styles.labelRow}>
          <Text variant="body2Weight" numberOfLines={1}>
            Syncing AI Pin...
          </Text>
          {percentage !== undefined && (
            <Text variant="body2Regular" color="textSecondary">
              {percentage}%
            </Text>
          )}
        </View>
        <View style={styles.track(theme)}>
          {percentage !== undefined && (
            <View
              style={[styles.progress(theme), { width: `${percentage}%` }]}
            />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = createStyles({
  root: (theme) => ({
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: theme.colors.layerDefault,
    borderColor: theme.colors.borderStaticDefault,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    left: 20,
    maxWidth: 340,
    minHeight: 50,
    paddingHorizontal: 12,
    position: "absolute",
    right: 20,
  }),
  pressed: { opacity: 0.82 },
  icon: (theme) => ({
    alignItems: "center",
    backgroundColor: theme.colors.layerBrandLight2,
    borderRadius: 8,
    height: 32,
    justifyContent: "center",
    width: 32,
  }),
  copy: { flex: 1, gap: 4 },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  track: (theme) => ({
    backgroundColor: theme.colors.layerStrong,
    borderRadius: 2,
    height: 3,
    overflow: "hidden",
  }),
  progress: (theme) => ({
    backgroundColor: theme.colors.interactivePrimaryDefault,
    height: 3,
  }),
});
