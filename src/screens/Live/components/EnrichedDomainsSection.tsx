import { type FC } from "react";
import { View } from "react-native";
import { Text, RNText } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { format } from "date-fns";
import type { EnrichDomainsQuery } from "@/graphql";
import { EnrichedDomainLoadingSkeleton } from "./EnrichedDomainLoadingSkeleton";

type EnrichedDomain = NonNullable<
  NonNullable<EnrichDomainsQuery["enrichDomains"]>[number]
>;

interface EnrichedDomainsSectionProps {
  enrichedDomains?: EnrichDomainsQuery["enrichDomains"];
  loading?: boolean;
  shouldShowPrepMetaData?: boolean;
}

export const EnrichedDomainsSection: FC<EnrichedDomainsSectionProps> = ({
  enrichedDomains = [],
  loading = false,
  shouldShowPrepMetaData = false,
}) => {
  const theme = useTheme();

  if (loading) return <EnrichedDomainLoadingSkeleton />;

  if (!enrichedDomains?.length) return null;

  return (
    <>
      {enrichedDomains.map((domain) => {
        if (!domain?.description) return null;

        return (
          <View
            key={domain._id}
            style={[
              styles.domainContainer(theme),
              !shouldShowPrepMetaData && {
                marginTop: 0,
                borderTopWidth: 0,
                borderTopColor: "transparent",
                paddingTop: 0,
              },
            ]}
          >
            <Text variant="title2Weight" style={styles.title}>
              Recent Headlines For {domain.name}
            </Text>
            <Text
              variant="body2LongRegular"
              color="textMuted"
              style={styles.description}
            >
              {domain.description}
            </Text>
            <View style={styles.headlinesContainer}>
              {domain.recentHeadlines?.map(
                (
                  headline: NonNullable<
                    EnrichedDomain["recentHeadlines"]
                  >[number],
                ) => {
                  if (!headline) return null;
                  const { occurredAt, title, content, emoji } = headline;
                  if (!occurredAt) return null;

                  return (
                    <View key={occurredAt} style={styles.headlineItem}>
                      <View style={styles.emojiContainer}>
                        <Text variant="body2Regular">{emoji || ""}</Text>
                      </View>
                      <View style={styles.headlineContent}>
                        <RNText>
                          {title && (
                            <Text variant="body2LongRegular">
                              {title.slice(0, -1)}:{" "}
                            </Text>
                          )}
                          <Text
                            variant="body2Regular"
                            color="textMuted"
                            style={styles.headlineText}
                          >
                            {content}
                          </Text>
                          <Text variant="body2Regular" color="textHint">
                            {" "}
                            ({format(new Date(occurredAt), "MMM d, yyyy")})
                          </Text>
                        </RNText>
                      </View>
                    </View>
                  );
                },
              )}
            </View>
          </View>
        );
      })}
    </>
  );
};

const styles = createStyles({
  domainContainer: (theme) => ({
    flexDirection: "column",
    gap: 6,
    paddingLeft: 0,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderStaticSubtle,
  }),
  title: {
    marginBottom: 2,
  },
  description: {
    marginBottom: 16,
  },
  headlinesContainer: {
    flexDirection: "column",
    gap: 8,
  },
  headlineItem: {
    flexDirection: "row",
    gap: 5,
    alignItems: "flex-start",
  },
  emojiContainer: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  headlineContent: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  headlineText: {
    flex: 1,
  },
});
