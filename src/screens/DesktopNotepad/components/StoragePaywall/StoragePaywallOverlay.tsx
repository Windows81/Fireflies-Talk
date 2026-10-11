import { createStyles } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import { getWindowChromeLeftInset } from "@/utils/desktopWindowChrome";
import type { FC } from "react";
import { StyleSheet, View } from "react-native";
import { STORAGE_PAYWALL_Z_INDEX } from "../../constants";
import { useIsWindowFullscreen } from "../../hooks/useIsWindowFullscreen";
import { NotepadBackButton } from "../NotepadBackButton";
import { StoragePaywallCard } from "./StoragePaywallCard";

/**
 * Blocking takeover shown when the team is out of storage. It covers the whole
 * notepad — including the nav bar — so the only ways forward are upgrading,
 * freeing space, or going back. It deliberately has no close affordance.
 */
export const StoragePaywallOverlay: FC<{
  consumedMinutes: number;
  limitMinutes: number;
  showUpgrade: boolean;
  onUpgrade: () => void;
  onReviewMeetings: () => void;
  onBack?: () => void;
}> = ({
  consumedMinutes,
  limitMinutes,
  showUpgrade,
  onUpgrade,
  onReviewMeetings,
  onBack,
}) => {
  const isFullscreen = useIsWindowFullscreen();

  return (
    <View style={styles.root}>
      {/* Re-rendered above the scrim because the real nav bar is behind it.
          Positioned to land exactly over that one so the button does not
          appear to move as the overlay mounts. */}
      <View
        style={[
          styles.backButton,
          { left: getWindowChromeLeftInset(isFullscreen) },
        ]}
      >
        <NotepadBackButton onBack={onBack} />
      </View>
      <StoragePaywallCard
        consumedMinutes={consumedMinutes}
        limitMinutes={limitMinutes}
        showUpgrade={showUpgrade}
        onUpgrade={onUpgrade}
        onReviewMeetings={onReviewMeetings}
      />
    </View>
  );
};

const styles = createStyles({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: STORAGE_PAYWALL_Z_INDEX,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: DESKTOP_THEME.overlayBlurredScrim,
    // Desktop-only screen, so the web backdrop filter is always available.
    backdropFilter: "blur(12px)",
  },
  // Matches DesktopNotepadNavBar's vertical padding so the two back buttons
  // occupy the same pixels.
  backButton: {
    position: "absolute",
    top: 6,
  },
});
