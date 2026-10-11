import AiPinModule from "./AiPinModule";
import type { AiPinModuleEvents } from "./types";

export const isAiPinAvailable = AiPinModule !== null;

function requireAiPin() {
  if (!AiPinModule)
    throw new Error("AI Pin is available on Android and iOS only.");
  return AiPinModule;
}

export const addAiPinEventListener = <TEvent extends keyof AiPinModuleEvents>(
  event: TEvent,
  listener: AiPinModuleEvents[TEvent],
) => requireAiPin().addListener<TEvent>(event, listener);

export const startScan = () => requireAiPin().startScan();
export const stopScan = () => requireAiPin().stopScan();
export const connect = (deviceId: string) => requireAiPin().connect(deviceId);
export const disconnect = () => requireAiPin().disconnect();
export const listFiles = () => requireAiPin().listFiles();
export const download = (filename: string, expectedSize: number) =>
  requireAiPin().download(filename, expectedSize);
export const removeDownload = (filename: string) =>
  requireAiPin().removeDownload(filename);
export const getStatus = () => requireAiPin().getStatus();

export type {
  AiPinConnectionEvent,
  AiPinConnectionState,
  AiPinDevice,
  AiPinDownloadedFile,
  AiPinDownloadProgress,
  AiPinFile,
  AiPinRecordingEvent,
  AiPinStatus,
} from "./types";
