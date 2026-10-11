import { imageConsentBackdrop, imageConsentSpeaker } from "@/assets/images";
import { IconLogo } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles } from "@/styles";
import { LinearGradient } from "expo-linear-gradient";
import type { FC } from "react";
import { Image, StyleSheet, View } from "react-native";

/**
 * Header artwork: a webcam tile wearing the recording badge, over a dimmed
 * backdrop. The rgba values below composite the illustration itself — they are
 * scrims over photography, not themed surfaces.
 */
export const ConsentSetupVisual: FC = () => (
  <View style={styles.root}>
    <Image
      source={imageConsentBackdrop}
      style={styles.fill}
      resizeMode="cover"
    />
    <View style={styles.scrim} />
    <View style={styles.card}>
      <View style={styles.tile}>
        <Image
          source={imageConsentSpeaker}
          style={styles.fill}
          resizeMode="cover"
        />
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <IconLogo width={12} height={12} />
            <Text
              variant="label3Weight"
              fontSize={CAPTION_FONT_SIZE}
              color="commandContrastDefault"
            >
              AI Taking Notes
            </Text>
          </View>
        </View>
        <LinearGradient
          colors={["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.8)"]}
          style={styles.caption}
        >
          <Text
            variant="label3Weight"
            fontSize={CAPTION_FONT_SIZE}
            color="commandContrastDefault"
          >
            Ross
          </Text>
        </LinearGradient>
      </View>
    </View>
  </View>
);

/** Sized to the tile, not to the modal, so the mock reads as a video frame. */
const CAPTION_FONT_SIZE = 8.6;

const styles = createStyles({
  root: {
    height: 236,
    // Shrinks first when the window is too short for the modal at full size,
    // so the options and the button never get clipped.
    flexShrink: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  // Explicit 100%: an absolutely positioned image with only inset offsets falls
  // back to its intrinsic size on web, which crops instead of covering.
  fill: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  card: {
    padding: 5,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    backgroundColor: "rgba(0, 0, 0, 0.24)",
    boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.1)",
  },
  tile: {
    width: 270,
    height: 161,
    borderRadius: 10.5,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  badgeRow: {
    alignItems: "center",
    paddingTop: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  caption: {
    height: 41,
    paddingHorizontal: 7,
    paddingBottom: 7,
    flexDirection: "row",
    alignItems: "flex-end",
  },
});
