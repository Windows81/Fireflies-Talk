import { useState } from "react";
import { useLiveScreenContext } from "../../Context/LiveScreenContext";
import { LEFT_TAB, RIGHT_TAB, type LeftTab, type RightTab } from "../constants";

/**
 * Owns the left (Notes | Live Assist) and right (AskFred | Transcript) tab
 * selection and derives the Live Assist badge count from realtime assist
 * suggestions for the active assist mode.
 */
export function useRealtimePanelTabs() {
  const [leftTab, setLeftTab] = useState<LeftTab>(LEFT_TAB.NOTES);
  const [rightTab, setRightTab] = useState<RightTab>(RIGHT_TAB.ASK_FRED);

  const { assistActions, assistMode } = useLiveScreenContext();
  const liveAssistCount = assistActions.filter(
    (action) => !action.assistMode || action.assistMode === assistMode,
  ).length;

  return { leftTab, setLeftTab, rightTab, setRightTab, liveAssistCount };
}
