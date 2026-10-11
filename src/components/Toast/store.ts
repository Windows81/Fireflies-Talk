import mitt from "mitt";
import type { ToastData } from "./types";

/**
 * In react-native, a modal is rendered outside of the tree, so it's not possible to
 * for <Toaster /> to be on top of the modal. Therefore, every time we implement a modal,
 * we need to also render <Toaster /> in the modal.
 *
 * To keep track of the <Toaster /> instances, we use this array. Only the last instance
 * in the array is rendered - that is if we have a <Toaster /> in the main app and a
 * <Toaster /> in the modal, only the <Toaster /> in the modal is rendered.
 */
export const toastInstanceRef = [];

type Events = {
  toast: string | ToastData;
};

export const emitter = mitt<Events>();
