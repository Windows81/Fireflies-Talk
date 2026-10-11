import { IconClock } from "@/assets/svg";
import { SkeletonLoading } from "@/components/Loading";
import { markdownToHtml } from "@/components/Markdown";
import { MessageView } from "@/components/Message";
import { StaticTag } from "@/components/Tag";
import { toast } from "@/components/Toast";
import { SummarySectionKey } from "@/constants";
import { useDownloadedMeetingPayload } from "@/features/downloads";
import type { MeetingSummarySection } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { copyAsHtml } from "@/utils/clipboard";
import { useQuery } from "@apollo/client";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import {
  GetMeetingSummaryQueryDocument,
  MeetingSummaryStatus,
} from "@firefliesai/mobile-ff.graphql-client";
import type { FC } from "react";
import { useCallback, useEffect, useMemo } from "react";
import { ScrollView, View } from "react-native";
import { sharedStyles } from "../styles";
import { transformContent } from "../utils/transform-content";
import { NotepadSummaryFailed } from "./NotepadSummaryFailed";
import { NotepadSummarySkipped } from "./NotepadSummarySkipped";
import { SummarySection } from "./SummarySection";

const organizeAndTransformSections = (
  meeting: Meeting,
  sections: MeetingSummarySection[],
) => {
  const keywordSummarySection = sections.find(
    (section) => section.key === SummarySectionKey.KEYWORDS,
  );

  const nonAiAppSections = sections
    .filter(
      (section) =>
        section.key !== SummarySectionKey.KEYWORDS && !section.isAiApp,
    )
    .map((section) => ({
      ...section,
      value: section.value ? transformContent(meeting, section.value) : null,
    }));

  const aiAppSections = sections.filter((section) => section.isAiApp);

  return { keywordSummarySection, nonAiAppSections, aiAppSections };
};

export const NotepadSummary: FC<{ meeting: Meeting }> = ({ meeting }) => {
  const theme = useTheme();

  const { data, error, loading, refetch } = useQuery(
    GetMeetingSummaryQueryDocument,
    { variables: { meetingId: meeting.id } },
  );

  // offline fallback: render the downloaded copy when the query has no data
  const { payload } = useDownloadedMeetingPayload(meeting.id);
  const meetingSummary = data?.meetingSummary ?? payload?.summary;

  useEffect(() => {
    if (
      data?.meetingSummary.summaryStatus === MeetingSummaryStatus.Processing
    ) {
      const to = setTimeout(() => {
        refetch();
      }, 30000);
      return () => clearTimeout(to);
    }
  }, [data?.meetingSummary.summaryStatus, refetch]);

  const sections = meetingSummary?.sections;
  const summaryStatus = meetingSummary?.summaryStatus;

  const { keywordSummarySection, nonAiAppSections, aiAppSections } = useMemo(
    () => organizeAndTransformSections(meeting, sections || []),
    [meeting, sections],
  );

  const onCopyAll = useCallback(() => {
    let html = "";

    const allSections = [...nonAiAppSections, ...aiAppSections];

    if (!allSections.length) return;

    allSections.forEach((section) => {
      if (!section.value) return;
      html += `<h1>${section.title}</h1>`;
      html += markdownToHtml(section.value);
    });

    copyAsHtml(html).then(
      () => {
        toast({
          message: "Copied to clipboard",
        });
      },
      (error) => {
        toast({
          title: "Failed to copy",
          message: error.message,
          type: "error",
        });
      },
    );
  }, [nonAiAppSections, aiAppSections]);

  if (loading && !meetingSummary) return <LoadingNotepadSummary />;

  if (error && !meetingSummary) {
    return (
      <MessageView
        title="An error occurred while loading summary"
        description={error.message}
      />
    );
  }

  if (!sections) {
    return <MessageView title="No meeting summary data." />;
  }

  if (summaryStatus === MeetingSummaryStatus.Failed) {
    return <NotepadSummaryFailed meeting={meeting} />;
  }

  if (summaryStatus === MeetingSummaryStatus.Skipped) {
    return <NotepadSummarySkipped meeting={meeting} />;
  }

  if (summaryStatus === MeetingSummaryStatus.Processing) {
    return (
      <MessageView
        title="Summary is being processed"
        description="Please check back in few mins"
        header={
          <IconClock
            color={theme.colors.textSecondary}
            width={24}
            height={24}
          />
        }
      />
    );
  }

  if (!sections?.length) {
    return <MessageView title="Summary is not available" />;
  }

  const keywords = keywordSummarySection?.value
    ?.split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  return (
    <ScrollView
      style={sharedStyles.tabPanel}
      contentContainerStyle={[sharedStyles.container, styles.content]}
    >
      {!!keywords?.length && (
        <View style={styles.keywords} role="list" aria-label="AI Keywords">
          {keywords.map((keyword, index) => (
            <StaticTag color="gray" key={`${index}/${keyword}`} role="listitem">
              {keyword}
            </StaticTag>
          ))}
        </View>
      )}
      {nonAiAppSections.map((section) => (
        <SummarySection
          key={section.key}
          meeting={meeting}
          section={section}
          onCopyAll={onCopyAll}
        />
      ))}
      {aiAppSections.map((section) => (
        <SummarySection
          key={section.key}
          meeting={meeting}
          section={section}
          onCopyAll={onCopyAll}
        />
      ))}
    </ScrollView>
  );
};

export const LoadingNotepadSummary: FC = () => {
  return (
    <ScrollView
      scrollEnabled={false}
      style={sharedStyles.tabPanel}
      contentContainerStyle={[sharedStyles.container, styles.content]}
    >
      <View style={styles.keywords}>
        <SkeletonLoading width={48} height={20} />
        <SkeletonLoading width={56} height={20} />
        <SkeletonLoading width={52} height={20} />
        <SkeletonLoading width={40} height={20} />
      </View>
      {Array.from({ length: 3 }).map((_, index) => (
        <View style={styles.loading} key={index}>
          <View style={styles.loadingRow}>
            <SkeletonLoading width={100} height={20} />
            <SkeletonLoading width={40} height={20} />
          </View>
          <SkeletonLoading width="100%" height={140} />
        </View>
      ))}
    </ScrollView>
  );
};

const styles = createStyles({
  content: {
    gap: 32,
    paddingTop: 24,
    paddingBottom: 64,
  },
  keywords: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  list: {
    flexDirection: "column",
    gap: 12,
    paddingLeft: 18,
  },
  loading: {
    gap: 24,
  },
  loadingRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
});
