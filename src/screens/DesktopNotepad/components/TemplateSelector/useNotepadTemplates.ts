import { toast } from "@/components/Toast";
import {
  GetMeetingSummaryTemplateDocument,
  useGetMeetingSummaryTemplateQuery,
  useGetTemplatesGroupedByCategoryQuery,
  useRunSummaryManuallyMutation,
  type GetTemplatesGroupedByCategoryQuery,
} from "@/graphql";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { useEffect, useMemo, useState } from "react";
import { SUMMARY_LABEL } from "../../constants";
import { useSummaryProcessing } from "../../hooks/useSummaryProcessing";

// Keep the active-template label in sync once regeneration settles.
const TEMPLATE_REFETCH_DOCUMENTS = [GetMeetingSummaryTemplateDocument];

// The query selects a subset of fields, so derive the shape from the operation
// rather than the full schema DTO.
export type NotepadTemplateCategory =
  GetTemplatesGroupedByCategoryQuery["getTemplatesGroupedByCategory"][number];

export interface NotepadTemplatesState {
  categories: NotepadTemplateCategory[];
  loading: boolean;
  selectedTemplateId: string | null;
  /** True when the summary uses the default (General Summary) template. */
  isGeneralSelected: boolean;
  selectedTitle: string;
  /** Pass a templateId to switch templates, or null for General Summary. */
  applyTemplate: (templateId: string | null) => void;
}

export function useNotepadTemplates(meetingId: string): NotepadTemplatesState {
  const { data: groupedData, loading: groupsLoading } =
    useGetTemplatesGroupedByCategoryQuery();
  const { data: summaryData, loading: summaryLoading } =
    useGetMeetingSummaryTemplateQuery({ variables: { meetingId } });

  const {
    start: startPolling,
    acquireProcessing,
    releaseProcessing,
  } = useSummaryProcessing(meetingId, {
    refetchDocuments: TEMPLATE_REFETCH_DOCUMENTS,
  });
  const [runSummary] = useRunSummaryManuallyMutation();

  // Optimistic selection so the dropdown reflects the chosen format instantly,
  // instead of waiting for regeneration to settle and the template to refetch.
  // `undefined` = no pending override; `null` = General Summary.
  const [pendingTemplateId, setPendingTemplateId] = useState<
    string | null | undefined
  >(undefined);

  const allCategories = useMemo(
    () => groupedData?.getTemplatesGroupedByCategory ?? [],
    [groupedData],
  );

  const { defaultTemplateId, defaultCategoryId, titleById } = useMemo(() => {
    const titles = new Map<string, string>();
    let defaultId: string | null = null;
    let defaultCatId: string | null = null;
    for (const category of allCategories) {
      for (const template of category.templates) {
        titles.set(template.id, template.title);
        if (template.default) {
          defaultId = template.id;
          defaultCatId = category.id;
        }
      }
    }
    return {
      defaultTemplateId: defaultId,
      defaultCategoryId: defaultCatId,
      titleById: titles,
    };
  }, [allCategories]);

  const categories = useMemo(
    () => allCategories.filter((category) => category.id !== defaultCategoryId),
    [allCategories, defaultCategoryId],
  );

  const serverTemplateId = summaryData?.getMeetingSummary?.templateId ?? null;

  // Collapse General (no id) and the account default to a single "null" form.
  const toGeneralNull = (id: string | null) =>
    !id || id === defaultTemplateId ? null : id;

  // Drop the optimistic override once the server reflects the chosen template.
  useEffect(() => {
    if (pendingTemplateId === undefined) return;
    if (toGeneralNull(serverTemplateId) === toGeneralNull(pendingTemplateId)) {
      setPendingTemplateId(undefined);
    }
    // toGeneralNull is derived from defaultTemplateId, tracked below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverTemplateId, pendingTemplateId, defaultTemplateId]);

  const rawTemplateId =
    pendingTemplateId !== undefined ? pendingTemplateId : serverTemplateId;
  const isGeneralSelected =
    !rawTemplateId || rawTemplateId === defaultTemplateId;
  const selectedTemplateId = isGeneralSelected ? null : rawTemplateId;
  const selectedTitle =
    (selectedTemplateId && titleById.get(selectedTemplateId)) || SUMMARY_LABEL;

  const applyTemplate = (templateId: string | null) => {
    tracker.track(TRACKING_EVENTS.NOTEPAD_TEMPLATE_CHANGED, {
      meetingId,
      templateId,
      templateName: (templateId && titleById.get(templateId)) || SUMMARY_LABEL,
    });

    // General Summary regenerates with the account default (no explicit id).
    const variables = templateId
      ? { meetingId, templateId }
      : { meetingId, templateId: defaultTemplateId ?? undefined };

    // runSummaryManually blocks until the summary is regenerated, so reflect the
    // processing state on the summary section for the whole duration up front.
    acquireProcessing();
    setPendingTemplateId(templateId);
    runSummary({ variables })
      .then(({ data }) => {
        if (!data?.runSummaryManually) {
          releaseProcessing();
          setPendingTemplateId(undefined);
          toast({ message: "Something went wrong. Please try again later" });
          return;
        }
        toast("Applying template to your summary…");
        // Confirm the status post-mutation and refetch the settled summary.
        startPolling({ processingHeld: true });
      })
      .catch((error: Error) => {
        releaseProcessing();
        setPendingTemplateId(undefined);
        toast({
          type: "error",
          title: "Could not apply template",
          message: error.message,
        });
      });
  };

  return {
    categories,
    loading: groupsLoading || summaryLoading,
    selectedTemplateId,
    isGeneralSelected,
    selectedTitle,
    applyTemplate,
  };
}
