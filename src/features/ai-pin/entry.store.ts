import { create } from "zustand";

interface AiPinEntryState {
  visible: boolean;
  recording: boolean;
  open?: () => void;
}

export const useAiPinEntry = create<AiPinEntryState>()(() => ({
  visible: false,
  recording: false,
}));
