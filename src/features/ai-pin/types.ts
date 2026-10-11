import type {
  AiPinConnectionState,
  AiPinDevice,
  AiPinRecordingEvent,
} from "@/modules/ai-pin";
import type { AiPinSheetMode } from "./panel-state";
import type { AiPinSyncProgress } from "./sync";

export interface AiPinControllerState {
  device?: AiPinDevice;
  serial?: string;
  batteryLevel?: number;
  connectionState: AiPinConnectionState;
  recording?: AiPinRecordingEvent;
  sync?: AiPinSyncProgress;
  sheetMode: AiPinSheetMode;
  error?: string;
}

// Returned while the feature is off so the sheet closes declaratively while
// the controller tears down its activity.
export const DISABLED_STATE: AiPinControllerState = {
  connectionState: "disconnected",
  sheetMode: "hidden",
};
