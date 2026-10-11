import { useEffect } from "react";
import { AiPinSheet } from "./AiPinSheet";
import { AiPinStatusPill } from "./AiPinStatusPill";
import { useAiPinEntry } from "./entry.store";
import { useAiPinController } from "./useAiPinController";
import { useAiPinEnabled } from "./useAiPinEnabled";

export function AiPinExperience() {
  const enabled = useAiPinEnabled();
  const { state, connect, dismiss, openEntry, retry, disconnect, syncNow } =
    useAiPinController(enabled);

  useEffect(() => {
    useAiPinEntry.setState({
      visible:
        enabled &&
        (Boolean(state.device) || state.connectionState === "connected"),
      recording: Boolean(state.recording?.active),
      open: enabled ? openEntry : undefined,
    });
  }, [
    enabled,
    openEntry,
    state.connectionState,
    state.device,
    state.recording?.active,
  ]);

  useEffect(() => {
    return () => {
      useAiPinEntry.setState({
        visible: false,
        recording: false,
        open: undefined,
      });
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <AiPinStatusPill state={state} onPress={openEntry} />
      <AiPinSheet
        state={state}
        onConnect={() => void connect()}
        onDismiss={dismiss}
        onRetry={retry}
        onDisconnect={() => void disconnect()}
        onSync={syncNow}
      />
    </>
  );
}
