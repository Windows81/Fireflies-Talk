const PILL_GAP = 8;
// COMPACT_HEIGHT of LiveRecordFloatingCard and LiveMeetingFloatingCard.
const FLOATING_CARD_HEIGHT = 84;
// Slack so the top-of-feed bounce and pull-to-refresh keep the bar expanded.
const EXPANDED_MAX_SCROLL_OFFSET = 12;

interface AskFredOHomePillVisibility {
  isEnabled: boolean;
  isDesktop: boolean;
}

// The pill sits inside Home, which the tab bar already keeps clear of the
// bottom safe area; the tablet sidebar layout reaches the screen edge. A docked
// floating card covers both, so the pill sits on top of it.
export const getAskFredOHomePillBottom = ({
  hasTabBar,
  bottomInset,
  isFloatingCardVisible,
}: {
  hasTabBar: boolean;
  bottomInset: number;
  isFloatingCardVisible: boolean;
}): number => {
  if (isFloatingCardVisible) return FLOATING_CARD_HEIGHT + PILL_GAP;
  return (hasTabBar ? 0 : bottomInset) + PILL_GAP;
};

export const shouldExpandAskFredOHomePill = (scrollOffsetY: number): boolean =>
  scrollOffsetY <= EXPANDED_MAX_SCROLL_OFFSET;

export const shouldShowAskFredOHomePill = ({
  isEnabled,
  isDesktop,
}: AskFredOHomePillVisibility): boolean => isEnabled && !isDesktop;
