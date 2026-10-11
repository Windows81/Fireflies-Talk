import { create } from "zustand";
import { Logger } from "@/logger";

const log = new Logger("ConsentDelivery");

export type ConsentDeliveryStatus = "idle" | "pending" | "delivered" | "failed";

interface ConsentDeliveryState {
  /** Chat message delivery (keyboard auto-send on Zoom/Meet, server-side on Teams). */
  status: ConsentDeliveryStatus;
  /** Spoken announcement through the system speakers. */
  audio: ConsentDeliveryStatus;
  setStatus: (status: ConsentDeliveryStatus) => void;
  setAudio: (audio: ConsentDeliveryStatus) => void;
  reset: () => void;
}

export const useConsentDeliveryStore = create<ConsentDeliveryState>((set) => ({
  status: "idle",
  audio: "idle",
  setStatus: (status) => {
    log.info("Status changed", { status });
    set({ status });
  },
  setAudio: (audio) => {
    log.info("Audio status changed", { audio });
    set({ audio });
  },
  reset: () => {
    log.info("Status reset to idle");
    set({ status: "idle", audio: "idle" });
  },
}));
