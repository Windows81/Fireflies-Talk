/**
 * One modal presentation slot, i.e. one presenting view controller.
 *
 * iOS presents every RN `Modal` as a view controller, and a view controller can
 * only present one modal at a time. A second modal presented while the first is
 * still up is refused by UIKit — "Attempt to present ... which is already
 * presenting ..." — and React keeps the refused modal mounted with
 * `visible={true}`, so it is never shown, never fires `onShow`/`onDismiss`, and
 * can never be closed. The modal that did present keeps swallowing touches, so
 * the app stays wedged until it is restarted.
 *
 * Modals therefore take turns: whoever asks first is presented, the rest wait in
 * order and are handed the slot as it frees up.
 */
export class PresentationSlot {
  #presented: string | null = null;
  #waiting: string[] = [];
  #listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  isPresenting = (id: string) => this.#presented === id;

  /** Ask for the slot, taking it when free and queueing otherwise. */
  request(id: string) {
    if (this.#presented === id || this.#waiting.includes(id)) return;
    if (this.#presented === null) this.#presented = id;
    else this.#waiting.push(id);
    this.#emit();
  }

  /** Give up the slot (or leave the queue), handing it to whoever is next. */
  release(id: string) {
    if (this.#presented === id) {
      this.#presented = this.#waiting.shift() ?? null;
    } else if (this.#waiting.includes(id)) {
      this.#waiting = this.#waiting.filter((waiting) => waiting !== id);
    } else {
      return;
    }
    this.#emit();
  }

  #emit() {
    this.#listeners.forEach((listener) => listener());
  }
}
