import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Platform } from "react-native";
import { PresentationSlot } from "./presentation-slot";

/**
 * Only iOS presents modals as view controllers, so only iOS can refuse a second
 * one and wedge the app (see PresentationSlot). Android and web stay uncoordinated.
 */
const SERIALIZE_PRESENTATION = Platform.OS === "ios";

/**
 * `onDismiss` is iOS-only and lands ~25-30ms after `visible` flips false.
 * Releasing the slot without waiting for it would re-create the race, but
 * waiting forever would strand the queue if the callback is ever dropped.
 */
const DISMISS_FALLBACK_MS = 800;

const ROOT_SLOT = new PresentationSlot();

/**
 * Sibling modals share a slot. A modal rendered inside another presents from
 * that modal's own view controller, so each one hands its children a new slot.
 */
export const ModalPresentationScope = createContext<PresentationSlot | null>(
  null,
);

let nextId = 0;

interface ModalPresentation {
  /** Pass to the native `Modal`'s `visible` prop. */
  visible: boolean;
  /** Pass to the native `Modal`'s `onDismiss` prop. */
  onDismiss: () => void;
  /** Provide via `ModalPresentationScope` so nested modals queue separately. */
  scope: PresentationSlot;
}

/**
 * Gates a modal's `visible` prop on exclusive ownership of its presentation
 * slot, so only one sibling modal is ever presented at a time. Returns the two
 * native `Modal` props to apply, with `onDismiss` wrapping the caller's own.
 */
export function useModalPresentation(
  isOpen: boolean,
  onDismiss?: () => void,
): ModalPresentation {
  const parent = useContext(ModalPresentationScope) ?? ROOT_SLOT;
  const [scope] = useState(() => new PresentationSlot());

  const idRef = useRef<string | undefined>(undefined);
  if (idRef.current === undefined) idRef.current = `modal-${nextId++}`;
  const id = idRef.current;

  const granted = useSyncExternalStore(
    parent.subscribe,
    () => parent.isPresenting(id),
    () => true,
  );

  useEffect(() => {
    if (!SERIALIZE_PRESENTATION) return;
    if (isOpen) parent.request(id);
    // A modal still waiting its turn has nothing to dismiss, so it leaves the
    // queue at once; a presented one holds the slot until onDismiss fires.
    else if (!parent.isPresenting(id)) parent.release(id);
  }, [isOpen, parent, id]);

  useEffect(() => {
    if (!SERIALIZE_PRESENTATION || isOpen) return;
    if (!parent.isPresenting(id)) return;
    const fallback = setTimeout(() => parent.release(id), DISMISS_FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, [isOpen, parent, id]);

  useEffect(() => {
    if (!SERIALIZE_PRESENTATION) return;
    return () => parent.release(id);
  }, [parent, id]);

  return {
    visible: SERIALIZE_PRESENTATION ? isOpen && granted : isOpen,
    scope,
    onDismiss: () => {
      // Free the slot before handing control back, so a caller that opens
      // another modal from here finds the slot already available.
      parent.release(id);
      onDismiss?.();
    },
  };
}
