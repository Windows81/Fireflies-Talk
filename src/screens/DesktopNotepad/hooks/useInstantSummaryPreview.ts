import { useOptionalLiveScreenContext } from "@/screens/Live/Context/LiveScreenContext";
import { getInstantSummaryContent } from "@/utils/instant-summary-content";

export interface InstantSummaryPreview {
  content: string | null;
  isCompleted: boolean;
  hasContent: boolean;
  isProcessing: boolean;
}

/**
 * Reads the live instant-summary stream from LiveScreenContext. Only
 * populated when the notepad is rendered in-place right after RTP (still
 * inside LiveScreenProvider); otherwise returns empty defaults.
 */
export function useInstantSummaryPreview(
  enabled: boolean,
): InstantSummaryPreview {
  const liveContext = useOptionalLiveScreenContext();

  if (!enabled || !liveContext) {
    return {
      content: null,
      isCompleted: false,
      hasContent: false,
      isProcessing: false,
    };
  }

  const { sectionContent, completedSections, isSummaryProcessing } =
    liveContext;
  const { content, isCompleted } = getInstantSummaryContent(
    sectionContent,
    completedSections,
  );

  const hasContent = Boolean(content?.trim());

  return {
    content: content ?? null,
    isCompleted,
    hasContent,
    isProcessing: isSummaryProcessing && !hasContent,
  };
}
