import { ASSISTANT_PANE_WIDTH } from "@/screens/DesktopNotepad/constants";
import { type Meeting } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { type FC } from "react";
import { View } from "react-native";
import { RightTopBar } from "../TopBar/RightTopBar";
import { RIGHT_TAB, type RightTab } from "../constants";
import { AskFredTab } from "./AskFredTab";
import { TranscriptTab } from "./TranscriptTab";

interface RightPanelProps {
  meeting: Meeting;
  rightTab: RightTab;
  onChangeTab: (tab: RightTab) => void;
}

export const RightPanel: FC<RightPanelProps> = ({
  meeting,
  rightTab,
  onChangeTab,
}) => {
  const theme = useTheme();
  return (
    <View style={styles.column}>
      <View style={styles.card(theme)}>
        <RightTopBar rightTab={rightTab} onChangeTab={onChangeTab} />
        <View style={styles.content} nativeID="rtp-side-content">
          {rightTab === RIGHT_TAB.ASK_FRED ? (
            <AskFredTab meeting={meeting} />
          ) : (
            <TranscriptTab meeting={meeting} />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = createStyles({
  column: {
    width: ASSISTANT_PANE_WIDTH,
  },
  // Figma "Pane": 400 wide, #07080A fill, #131416 hairline border, 12px radius,
  // no padding (the tabs header and content supply their own).
  card: (theme) => ({
    flex: 1,
    marginBottom: 16,
    backgroundColor: theme.colors.layerDefault,
    borderWidth: 1,
    borderColor: theme.colors.layerMuted,
    borderRadius: 12,
    overflow: "hidden",
  }),
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
});
