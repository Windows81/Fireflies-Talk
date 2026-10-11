import { imageCaptionsVisual, imageCaptionsVisualDark } from "@/assets/images";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { MessageView } from "@/components/Message";
import { Text } from "@/components/Typography";
import { ANALYTICS_CATEGORY_LABEL } from "@/constants";
import { openLoginPopup, useAuth } from "@/features/auth";
import { openSmartSearchPaywallModal } from "@/features/global-modals";
import { createStyles, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { isTruthy } from "@/utils/object";
import { useGetMeetingNoteAnalyticsQuery } from "@firefliesai/analytics-ff.graphql-client";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import { isFreeUser } from "@firefliesai/payments-ff.utils";
import type React from "react";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState, type FC } from "react";
import { ScrollView, View } from "react-native";
import type { FilterOptionProps } from "./components/FilterOptions";
import { FilterOptions } from "./components/FilterOptions";
import {
  loadingNodesAiFilterNodes,
  loadingSentimentFilterNodes,
} from "./components/Loadings";
import {
  SpeakerTalkTimeHeader,
  SpeakerTalkTimeValues,
  loadingSpeakerTalkTimeNodes,
} from "./components/SpeakerTalkTime";
import {
  SENTIMENT_COLOR_MAP,
  SMART_SEARCH_CATEGORY_COLOR_MAP,
} from "./constants";

export interface SmartSearchFilterState {
  categories: string[] | null;
  sentiment: ("positive" | "negative" | "neutral")[] | null;
  speakerIds: string[] | null;
}

const SmartSearchSection: FC<{
  title: string;
  options?: FilterOptionProps[];
  header?: React.ReactNode;
  numColumn: number;
  loadingNode?: React.ReactNode;
}> = ({ title, options, header, numColumn, loadingNode }) => {
  const theme = useTheme();

  return (
    <View style={styles.section(theme)}>
      <View style={styles.sectionHeader}>
        <Text variant="body3Regular" color="textMuted">
          {title}
        </Text>
      </View>
      {header}
      {options ? (
        <FilterOptions numColumn={numColumn} options={options} />
      ) : (
        loadingNode
      )}
    </View>
  );
};

export const NotepadSmartSearch: FC<{
  meeting: Meeting;
  smartSearchFilter: SmartSearchFilterState;
  setSmartSearchFilter: Dispatch<SetStateAction<SmartSearchFilterState>>;
  hasNoCaption?: boolean;
  close?: () => void;
}> = ({
  meeting,
  smartSearchFilter,
  setSmartSearchFilter,
  hasNoCaption,
  close,
}) => {
  const { user } = useAuth();

  const { data, loading, error, refetch } = useGetMeetingNoteAnalyticsQuery({
    variables: {
      parseId: meeting.id,
    },
    skip: hasNoCaption,
    notifyOnNetworkStatusChange: true,
  });

  const sentiments = data?.meetingNoteAnalytics?.sentiments;
  const categories = data?.meetingNoteAnalytics?.categories as Record<
    string,
    number
  > | null;
  const speakers = useMemo(() => {
    if (!data?.meetingNoteAnalytics?.speakers) return null;
    return [...data.meetingNoteAnalytics.speakers].sort(
      (a, b) => (b.duration || 0) - (a.duration || 0),
    );
  }, [data]);

  const shouldShowPaywall = !user || isFreeUser(user.paidUser);

  if (hasNoCaption) {
    return (
      <MessageView
        headerImage={imageCaptionsVisual}
        headerImageDark={imageCaptionsVisualDark}
        title="Smart search is not available"
        description="Smart search is only available for meetings with transcripts."
      />
    );
  }

  if (error) {
    return (
      <MessageView
        headerImage={imageCaptionsVisual}
        headerImageDark={imageCaptionsVisualDark}
        title="Could not load smart search"
        description={error.message}
        action={<Button onPress={() => refetch()}>Retry</Button>}
      />
    );
  }

  const toggleCategory = (category: string) => {
    if (!user) {
      close?.();
      return openLoginPopup("notepad/smart-search/category");
    }
    if (shouldShowPaywall) {
      close?.();
      return openSmartSearchPaywallModal("notepad/smart-search/category");
    }
    setSmartSearchFilter((prev) => {
      const categoriesFilter = new Set(prev.categories || []);
      if (categoriesFilter.has(category)) {
        categoriesFilter.delete(category);
      } else {
        categoriesFilter.add(category);
      }
      return {
        ...prev,
        categories: categoriesFilter.size ? Array.from(categoriesFilter) : null,
      };
    });
  };

  const toggleSentiment = (sentiment: "positive" | "negative" | "neutral") => {
    if (!user) {
      close?.();
      return openLoginPopup("notepad/smart-search/sentiment");
    }
    if (shouldShowPaywall) {
      close?.();
      return openSmartSearchPaywallModal("notepad/smart-search/sentiment");
    }
    setSmartSearchFilter((prev) => {
      const sentimentFilter = new Set(prev.sentiment || []);
      if (sentimentFilter.has(sentiment)) {
        sentimentFilter.delete(sentiment);
      } else {
        sentimentFilter.add(sentiment);
      }
      return {
        ...prev,
        sentiment: sentimentFilter.size ? Array.from(sentimentFilter) : null,
      };
    });
  };

  const toggleSpeaker = (speakerId: string) => {
    if (!user) {
      close?.();
      return openLoginPopup("notepad/smart-search/speaker");
    }
    if (shouldShowPaywall) {
      close?.();
      return openSmartSearchPaywallModal("notepad/smart-search/speaker");
    }
    setSmartSearchFilter((prev) => {
      const speakerFilter = new Set(prev.speakerIds || []);
      if (speakerFilter.has(speakerId)) {
        speakerFilter.delete(speakerId);
      } else {
        speakerFilter.add(speakerId);
      }
      return {
        ...prev,
        speakerIds: speakerFilter.size ? Array.from(speakerFilter) : null,
      };
    });
  };

  if (!data && loading) {
    return <LoadingSmartSearch />;
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {categories ? (
        <SmartSearchSection
          title="AI FILTERS"
          numColumn={2}
          options={Object.entries(categories).map(
            ([categoryKey, categoryCount]) => {
              return {
                key: categoryKey,
                selected:
                  smartSearchFilter.categories?.includes(categoryKey) ?? false,
                label: {
                  left:
                    ANALYTICS_CATEGORY_LABEL[
                      categoryKey as keyof typeof ANALYTICS_CATEGORY_LABEL
                    ] || categoryKey,
                  right: String(categoryCount),
                },
                color: SMART_SEARCH_CATEGORY_COLOR_MAP[categoryKey],
                onPress: () => toggleCategory(categoryKey),
              };
            },
          )}
        />
      ) : (
        <MessageView
          title="AI filters not available"
          description={
            hasNoCaption
              ? "The meeting has no capions to show AI filters"
              : "No AI filter data detected in this meeting."
          }
        />
      )}
      {sentiments ? (
        <SmartSearchSection
          title="SENTIMENT"
          numColumn={1}
          options={[
            typeof sentiments.positive === "number" && {
              key: "positive",
              selected:
                smartSearchFilter.sentiment?.includes("positive") ?? false,
              label: {
                left: "Positive",
                right: `${sentiments.positivePct}%`,
              },
              onPress: () => toggleSentiment("positive"),
              color: SENTIMENT_COLOR_MAP.positive,
            },
            typeof sentiments.neutral === "number" && {
              key: "neutral",
              selected:
                smartSearchFilter.sentiment?.includes("neutral") ?? false,
              label: {
                left: "Neutral",
                right: `${sentiments.neutralPct}%`,
              },
              onPress: () => toggleSentiment("neutral"),
              color: SENTIMENT_COLOR_MAP.neutral,
            },
            typeof sentiments.negative === "number" && {
              key: "negative",
              selected:
                smartSearchFilter.sentiment?.includes("negative") ?? false,
              label: {
                left: "Negative",
                right: `${sentiments.negativePct}%`,
              },
              onPress: () => toggleSentiment("negative"),
              color: SENTIMENT_COLOR_MAP.negative,
            },
          ].filter(isTruthy)}
        />
      ) : (
        <MessageView
          title="Sentiments not available"
          description={
            hasNoCaption
              ? "The meeting has no capions to show sentiment data"
              : "No sentiment data detected in this meeting."
          }
        />
      )}
      {speakers ? (
        <SmartSearchSection
          title="SPEAKERS TALKTIME"
          numColumn={1}
          header={<SpeakerTalkTimeHeader />}
          options={speakers.map((speaker) => {
            const speakerId = String(speaker.speakerId);
            const speakerName =
              meeting.speakerMeta?.[Number(speakerId) + 1] ||
              `Speaker ${Number(speakerId) + 1}`;
            return {
              selected:
                smartSearchFilter.speakerIds?.includes(speakerId) ?? false,
              key: speakerId,
              avatar: {
                name: speakerName,
              },
              label: {
                left: speakerName,
                right: <SpeakerTalkTimeValues speakerAnalytics={speaker} />,
              },
              onPress: () => toggleSpeaker(speakerId),
            };
          })}
        />
      ) : (
        <MessageView
          title="No speakers detected"
          description={
            hasNoCaption
              ? "The meeting has no capions to show speakers"
              : "No speakers detected in this meeting."
          }
        />
      )}
    </ScrollView>
  );
};

export const LoadingSmartSearch: FC = () => {
  return (
    <ScrollView
      scrollEnabled={false}
      style={styles.root}
      contentContainerStyle={styles.content}
    >
      <SmartSearchSection
        title="AI FILTERS"
        numColumn={2}
        loadingNode={loadingNodesAiFilterNodes}
      />
      <SmartSearchSection
        title="SENTIMENT"
        numColumn={1}
        loadingNode={loadingSentimentFilterNodes}
      />
      <SmartSearchSection
        title="SPEAKERS TALKTIME"
        numColumn={1}
        header={<SpeakerTalkTimeHeader />}
        loadingNode={loadingSpeakerTalkTimeNodes}
      />
    </ScrollView>
  );
};

export const SmartSearchModal: FC<{
  isOpen: boolean;
  close: () => void;
  meeting: Meeting;
  smartSearchFilter: SmartSearchFilterState;
  setSmartSearchFilter: Dispatch<SetStateAction<SmartSearchFilterState>>;
}> = ({ isOpen, close, meeting, smartSearchFilter, setSmartSearchFilter }) => {
  const [localSmartSearchFilter, setLocalSmartSearchFilter] =
    useState<SmartSearchFilterState>(smartSearchFilter);

  useEffect(() => {
    setLocalSmartSearchFilter(smartSearchFilter);
  }, [smartSearchFilter]);

  const onClose = () => {
    // we only apply filter after user close the modal
    setSmartSearchFilter(localSmartSearchFilter);
    if (Object.values(localSmartSearchFilter).some((v) => !!v)) {
      tracker.track(TRACKING_EVENTS.SMART_SEARCH_APPLIED, {
        meetingId: meeting.id,
        ...localSmartSearchFilter,
      });
    }
    close();
  };

  return (
    <Dialog.Root
      variant="bottomSheet"
      isOpen={isOpen}
      close={onClose}
      style={styles.dialog}
    >
      <Dialog.Header>Smart search</Dialog.Header>
      <NotepadSmartSearch
        meeting={meeting}
        smartSearchFilter={localSmartSearchFilter}
        setSmartSearchFilter={setLocalSmartSearchFilter}
        hasNoCaption={!meeting.captions?.length}
        close={onClose}
      />
    </Dialog.Root>
  );
};

const styles = createStyles({
  root: {
    gap: 36,
    flex: 1,
  },
  content: {
    paddingTop: 24,
    paddingBottom: 32,
  },
  dialog: {
    // TODO: maxHeight is very unreliable on modal for some reasons
    height: "90%",
  },
  section: (theme) => ({
    gap: 12,
    padding: 16,
    borderBottomColor: theme.colors.borderStaticSubtle,
    borderBottomWidth: 1,
  }),
  sectionHeader: {},
});
