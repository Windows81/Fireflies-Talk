import { useAuth } from "@/features/auth/store";
import { readFeatureIsOn } from "@/features/feature-flags/readFeatureIsOn";
import {
  apolloClient,
  GetCurrentUserDocument,
  type GetCurrentUserQuery,
} from "@/graphql";
import { Logger } from "@/logger";
import { isDesktop, isMainDesktopWindow } from "@/utils/device";
import type { StoreApi, UseBoundStore } from "zustand";
import { ASSISTANT_NUDGE_DELAY_MS } from "./constants";
import type { DictationAssistantNudgeStore } from "./dictation-assistant-nudge.store";
import { resolveAssistantNudgeWanted } from "./nudgePresence";
import type { NudgeShows } from "./schedule";

type CurrentUser = GetCurrentUserQuery["user"] | undefined;

interface AssistantNudgeOffer {
  userId: string;
}

interface AssistantNudgeBridge<Offer, Action> {
  setActive: (offer: Offer | null) => Promise<boolean> | undefined;
  onShown: (callback: () => void) => (() => void) | undefined;
  onAction: (callback: (action: Action) => void) => (() => void) | undefined;
}

export interface AssistantNudgeOfferConfig<
  Nudge extends NudgeShows,
  Offer extends AssistantNudgeOffer,
  Action,
> {
  /** Logger name. */
  name: string;
  /** How the assistant is named in logs, e.g. "Email Assistant". */
  label: string;
  store: UseBoundStore<StoreApi<DictationAssistantNudgeStore<Nudge, Offer>>>;
  isOwed: (userId: string) => boolean;
  nudgeFlag: string;
  canAccess: (user: CurrentUser) => boolean;
  readServerShows: (user: CurrentUser) => NudgeShows;
  /** Network check made right before the card goes up. */
  isSetUp: () => Promise<boolean>;
  buildOffer: (userId: string, user: CurrentUser) => Offer;
  bridge: AssistantNudgeBridge<Offer, Action>;
  onShown: (offer: Offer) => void;
  onAction: (offer: Offer, action: Action) => void;
}

/**
 * The assistant suggestion made beside the pill at dictation milestones
 * (3, 20, 50, 100), at least a day apart. It is only ever offered right after
 * a counted paste, never on launch. The card is its own window, so its actions
 * arrive through the desktop bridge and this is the one place that decides
 * what they mean. Runs in the main window, which owns the dictation runtime
 * and so sees every paste.
 */
export function initAssistantNudgeOffer<
  Nudge extends NudgeShows,
  Offer extends AssistantNudgeOffer,
  Action,
>(config: AssistantNudgeOfferConfig<Nudge, Offer, Action>): () => void {
  if (!isDesktop || !isMainDesktopWindow() || !window.electron?.dictation)
    return () => {};

  const logger = new Logger(config.name);
  const { store, bridge } = config;

  /**
   * Another device's shows advance this device's schedule and cooldown. The
   * fetched user is whoever is signed in now, so it only speaks for `userId`
   * while that is still the same account.
   */
  const adoptServerSeen = (userId: string, user: CurrentUser): void => {
    if (useAuth.getState().user?.id !== userId) return;

    store.getState().syncServerSeen(userId, config.readServerShows(user));
  };

  const isWanted = (userId: string, canAccess: boolean): boolean =>
    resolveAssistantNudgeWanted({
      owed: config.isOwed(userId),
      signedIn: useAuth.getState().user?.id === userId,
      nudgeFlagOn: readFeatureIsOn(config.nudgeFlag),
      canAccess,
    });

  const withdrawOffer = (): void => {
    store.getState().setOffer(null);
    void bridge.setActive(null);
  };

  const offerAfterPaste = async (userId: string): Promise<void> => {
    const user = await apolloClient.query({
      query: GetCurrentUserDocument,
      fetchPolicy: "cache-first",
      context: { silentErrors: true },
    });

    const canAccess = config.canAccess(user.data?.user);

    adoptServerSeen(userId, user.data?.user);
    if (!isWanted(userId, canAccess)) return;

    // The cached user can predate another device's show, so an owed offer
    // re-reads it before the card goes up.
    const [setUp, fresh] = await Promise.all([
      config.isSetUp(),
      apolloClient.query({
        query: GetCurrentUserDocument,
        fetchPolicy: "network-only",
        context: { silentErrors: true },
      }),
      new Promise<void>((r) => setTimeout(r, ASSISTANT_NUDGE_DELAY_MS)),
    ]);

    adoptServerSeen(userId, fresh.data?.user);
    if (setUp) return;

    if (store.getState().offer || !isWanted(userId, canAccess)) return;

    const offer = config.buildOffer(userId, user.data?.user);
    store.getState().setOffer(offer);

    const accepted = await bridge.setActive(offer);

    // Same offer, turned away: drop it for a later paste. The milestone stays unspent.
    if (accepted === false && store.getState().offer === offer) {
      store.getState().setOffer(null);
    }
  };

  const offPaste = store.subscribe((state, prevState) => {
    const paste = state.lastPaste;
    if (!paste || paste === prevState.lastPaste) return;

    offerAfterPaste(paste.userId).catch((error) => {
      logger.warn(`skipped ${config.label} offer`, { error });
    });
  });

  const offAuth = useAuth.subscribe((state, prevState) => {
    if (state.user?.id === prevState.user?.id) return;
    withdrawOffer();
  });

  const offShown = bridge.onShown(() => {
    const offer = store.getState().offer;
    if (offer) config.onShown(offer);
  });

  // The card stays up a moment after its first click, until the desktop
  // takes it down, and anything clicked in that gap is the same intent:
  // withdrawing the offer first makes only the first action count.
  const offAction = bridge.onAction((action) => {
    const offer = store.getState().offer;
    withdrawOffer();

    if (offer) config.onAction(offer, action);
  });

  return () => {
    offPaste();
    offAuth();
    offShown?.();
    offAction?.();
  };
}
