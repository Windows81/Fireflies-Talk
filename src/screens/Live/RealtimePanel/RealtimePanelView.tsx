import { type Meeting } from "@/graphql";
import { ThemeContext, createStyles, desktopUiTheme, useTheme } from "@/styles";
import { isMainDesktopWindow } from "@/utils/device";
import { type FC, useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TranscriptSearchProvider } from "../Context/TranscriptSearchContext";
import {
  RIGHT_TAB,
  RTP_BODY_PADDING_LEFT,
  RTP_BODY_PADDING_RIGHT,
} from "./constants";
import { LeftPanel } from "./LeftPanel/LeftPanel";
import { RightPanel } from "./RightPanel/RightPanel";
import { RealtimePanelNavBar } from "./TopBar/RealtimePanelNavBar";
import { SegmentTabs } from "./components/SegmentTabs";
import { LEFT_TAB, type LeftTab } from "./constants";
import { useRealtimePanelTabs } from "./hooks/useRealtimePanelTabs";

/**
 * Realtime panel for the live, wide/expanded recording view (desktop). Forces
 * the flat desktop-UI theme locally and splits into a left panel (notes / live
 * assist + floating recording controls) and a right panel (AskFred /
 * transcript). All data flows through the existing LiveScreen providers.
 */
export const RealtimePanelView: FC<{
  meeting: Meeting;
  onToggleViewMode?: () => void;
}> = ({ meeting, onToggleViewMode }) => {
  const { breakpoint } = useTheme();
  const theme = useMemo(
    () => ({ ...desktopUiTheme, breakpoint }),
    [breakpoint],
  );
  const { leftTab, setLeftTab, rightTab, setRightTab, liveAssistCount } =
    useRealtimePanelTabs();
  const [navBack, setNavBack] = useState<(() => void) | undefined>();
  const handleNavBackChange = useCallback(
    (handler: (() => void) | undefined) => {
      setNavBack(() => handler);
    },
    [],
  );

  // "Open realtime panel": in the one-window model the recording lives in the
  // main window, so pop it out into the floating always-on-top compact bar over
  // the meeting (recording keeps running via the main-process recording context;
  // closing the bar returns to main). In the legacy floating window this is the
  // compact/full toggle instead.
  const handleToggleViewMode = useCallback(() => {
    if (isMainDesktopWindow()) {
      // Explicit user choice, so it becomes their default for future meetings.
      // The forced mode below bypasses setMode, which is what normally persists.
      window.electron?.liveView?.setPreferredMode?.("compact");
      // Force compact so it opens the Live Assist bar directly, not the full
      // floating window (whose role the main window already fills).
      window.electron?.window
        .openLive(`/live/${meeting.id}`, "compact")
        .catch(() => {
          // non-fatal: floating panel failed to open
        });
      return;
    }
    onToggleViewMode?.();
  }, [meeting.id, onToggleViewMode]);

  return (
    <ThemeContext.Provider value={theme}>
      <TranscriptSearchProvider>
        <SafeAreaView style={styles.root(theme)} edges={["top"]}>
          <RealtimePanelNavBar
            meeting={meeting}
            onBack={navBack}
            onToggleViewMode={handleToggleViewMode}
            center={
              <SegmentTabs<LeftTab>
                value={leftTab}
                onValueChange={setLeftTab}
                items={[
                  { value: LEFT_TAB.NOTES, label: "Notes" },
                  {
                    value: LEFT_TAB.LIVE_ASSIST,
                    label: "Live Assist",
                    badgeCount: liveAssistCount,
                  },
                ]}
              />
            }
          />
          <View style={styles.row}>
            <LeftPanel
              meeting={meeting}
              leftTab={leftTab}
              onAskFredPrompt={() => setRightTab(RIGHT_TAB.ASK_FRED)}
              onNavBackChange={handleNavBackChange}
            />
            <RightPanel
              meeting={meeting}
              rightTab={rightTab}
              onChangeTab={setRightTab}
            />
          </View>
        </SafeAreaView>
      </TranscriptSearchProvider>
    </ThemeContext.Provider>
  );
};

const styles = createStyles({
  root: (theme) => ({
    flex: 1,
    backgroundColor: theme.colors.pageBackground,
  }),
  row: {
    flex: 1,
    flexDirection: "row",
    // Figma: 48px between the notes area and the AskFred/Transcript card,
    // 16px from the card to the window's right edge. Left gutter matches notepad.
    gap: 48,
    paddingLeft: RTP_BODY_PADDING_LEFT,
    paddingRight: RTP_BODY_PADDING_RIGHT,
  },
});
