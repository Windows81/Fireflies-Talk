import { IconX } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Text } from "@/components/Typography";
import { ThemeContext, createStyles, desktopUiTheme, useTheme } from "@/styles";
import { DESKTOP_THEME, withAlpha } from "@/styles/color";
import { useMemo, useState, type FC } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import {
  DESKTOP_GLASS_BUTTON_HOVER_STYLE,
  DESKTOP_GLASS_BUTTON_STYLE,
} from "./desktopCardStyle";
import {
  TALK_INTRO_ARTWORK_MIN_WIDTH,
  TalkIntroBannerArtwork,
} from "./TalkIntroBannerArtwork";

/** The 186px title on one line inside the 30px padding. */
const COPY_MIN_WIDTH = 246;

/**
 * The copy and the demo always sit side by side. The demo gives width back
 * to the copy first and only leaves once the two cannot share the row. The
 * app opens at 1100px, where the card is about 470px, and both fit there.
 */
const ARTWORK_MIN_CARD_WIDTH = COPY_MIN_WIDTH + TALK_INTRO_ARTWORK_MIN_WIDTH;

interface TalkIntroBannerProps {
  onTry: () => void;
  onDismiss: () => void;
}

export const TalkIntroBanner: FC<TalkIntroBannerProps> = ({
  onTry,
  onDismiss,
}) => {
  const { breakpoint } = useTheme();

  const theme = useMemo(
    () => ({ ...desktopUiTheme, breakpoint }),
    [breakpoint],
  );

  const [cardWidth, setCardWidth] = useState(0);
  const showArtwork = cardWidth === 0 || cardWidth >= ARTWORK_MIN_CARD_WIDTH;

  const onCardLayout = (event: LayoutChangeEvent) =>
    setCardWidth(event.nativeEvent.layout.width);

  return (
    <ThemeContext.Provider value={theme}>
      <View style={styles.card} onLayout={onCardLayout}>
        <View style={[styles.copy, !showArtwork && styles.copyAlone]}>
          <View style={styles.text}>
            <Text variant="title2Weight" color="textPrimary">
              Stop Typing. Start Talking.
            </Text>
            <Text variant="title3Regular" color="textMuted">
              Speak naturally, and clean text appears in slack, email, docs,
              anywhere you work.
            </Text>
          </View>
          <Button
            variant="outlined"
            size="sm"
            style={DESKTOP_GLASS_BUTTON_STYLE}
            hoverStyle={DESKTOP_GLASS_BUTTON_HOVER_STYLE}
            onPress={onTry}
            accessibilityLabel="Try Fireflies Talk"
          >
            Try Fireflies Talk
          </Button>
        </View>
        {showArtwork && <TalkIntroBannerArtwork />}
        <View style={styles.glow} pointerEvents="none" />
        <Button
          accessibilityLabel="Close Talk intro"
          Icon={IconX}
          onPress={onDismiss}
          size="xs"
          style={styles.closeButton}
          hoverStyle={styles.closeButtonHover}
          variant="transparentNeutral"
        />
      </View>
    </ThemeContext.Provider>
  );
};

const styles = createStyles({
  card: {
    width: "100%",
    height: 242,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: withAlpha(DESKTOP_THEME.grey100, 0.06),
    backgroundColor: DESKTOP_THEME.grey1050,
    overflow: "hidden",
    flexDirection: "row",
  },
  copy: {
    flex: 1,
    minWidth: COPY_MIN_WIDTH,
    paddingHorizontal: 30,
    paddingTop: 22,
    paddingBottom: 30,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  // With the demo gone the close button sits over the copy.
  copyAlone: {
    paddingRight: 56,
  },
  text: {
    width: 354,
    maxWidth: "100%",
    gap: 6,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    boxShadow: `inset 0px -16px 28px 0px ${withAlpha(DESKTOP_THEME.grey100, 0.15)}`,
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    minHeight: 32,
    width: 32,
  },
  closeButtonHover: {
    backgroundColor: "transparent",
  },
});
