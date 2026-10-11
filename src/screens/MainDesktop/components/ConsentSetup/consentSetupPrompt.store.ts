import { create } from "zustand";

interface ConsentSetupPromptState {
  visible: boolean;
  /** The recording the card is holding while the user answers. */
  pendingStart: (() => void) | null;
  /**
   * The install's first card, where every row starts ticked. Any later one
   * starts from what is configured, so it cannot turn a notice back on.
   */
  firstRun: boolean;
}

interface OpenConsentSetupOptions {
  firstRun: boolean;
}

/**
 * Module state rather than screen state, because the desktop home screen is
 * mounted more than once: onboarding `replace`s onto a stack that already has
 * one, and every `navigate` back from Settings or Live pushes another. Only the
 * top copy is on screen — the rest render `display: none` — while the IPC start
 * event is answered by the oldest, which is always one of the buried ones.
 *
 * With the card's state here, whichever copy takes the event, the copy the user
 * is actually looking at is the one that shows the card.
 */
export const useConsentSetupPromptStore = create<ConsentSetupPromptState>(
  () => ({
    visible: false,
    pendingStart: null,
    firstRun: false,
  }),
);

/**
 * Opens the card, handing it the recording to run once the user has answered.
 * A card already up keeps the rows it started with.
 */
export function openConsentSetup(
  start: () => void,
  { firstRun }: OpenConsentSetupOptions,
): void {
  const { visible } = useConsentSetupPromptStore.getState();
  useConsentSetupPromptStore.setState(
    visible
      ? { pendingStart: start }
      : { visible: true, pendingStart: start, firstRun },
  );
}

/**
 * Opens the card holding nothing, for the admin's requirements. A no-op while
 * it is already up, so every mounted copy of the screen can ask at once
 * without dropping a start the card is holding.
 */
export function openConsentSetupIfClosed({
  firstRun,
}: OpenConsentSetupOptions): void {
  if (useConsentSetupPromptStore.getState().visible) return;
  useConsentSetupPromptStore.setState({
    visible: true,
    pendingStart: null,
    firstRun,
  });
}

/**
 * Closes the card and gives back the start it was holding, once. Answering by
 * Continue, by "Start notes anyway" and by dismissing all land here, and the
 * approval step can resolve at the same moment the user clicks — so the start
 * is taken on the way out rather than left where a second call could run it.
 */
export function consumeConsentSetupStart(): (() => void) | null {
  const { pendingStart } = useConsentSetupPromptStore.getState();
  useConsentSetupPromptStore.setState({ visible: false, pendingStart: null });
  return pendingStart;
}
