import { InAppPaywallModal } from "@/components/Paywall";
import { Tabs } from "@/components/Tabs";
import { Text } from "@/components/Typography";
import { RouteNames } from "@/constants";
import { trackPaywallShown } from "@/features/paywall";
import { createStyles, useTheme } from "@/styles";
import { Tier } from "@firefliesai/payments-ff.utils";
import { useIsFocused } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { endOfDay, startOfDay, sub } from "date-fns";
import type { FC } from "react";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import type { ParamList } from "../types";
import { AnalyticsTab } from "./Analytics/Analytics";
import { TopicInsightsTab } from "./TopicInsights/TopicInsights";
import { DatePickerButton } from "./components/DatePicker";
import { useCanAccessAnalytics } from "./utils";

export const AnalyticsScreen: FC<
  NativeStackScreenProps<ParamList, "Analytics">
> = ({ navigation }) => {
  const theme = useTheme();
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    return [startOfDay(sub(now, { days: 7 })), endOfDay(now)] as [Date, Date];
  });

  const isFocused = useIsFocused();

  const canAccessAnalytics = useCanAccessAnalytics();

  return (
    <>
      <View style={styles.root}>
        <Tabs.Root>
          <Tabs.Panel name="analytics" title="Analytics">
            <AnalyticsTab dateRange={dateRange} />
          </Tabs.Panel>
          <Tabs.Panel name="topic-insights" title="Topic Insights">
            <TopicInsightsTab dateRange={dateRange} />
          </Tabs.Panel>
        </Tabs.Root>
        <View>
          <ScrollView
            style={styles.footer(theme)}
            contentContainerStyle={styles.footerContent}
            horizontal
          >
            <Text variant="label1Weight" color="textSecondary">
              Filters
            </Text>
            <DatePickerButton
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
          </ScrollView>
        </View>
      </View>
      <InAppPaywallModal
        isOpen={!canAccessAnalytics && isFocused}
        title="Upgrade to Access Analytics"
        description="Unlock deeper insights and drive value from different meetings across your workplace."
        pwl="mobile_analytics"
        onOpen={() => {
          trackPaywallShown({
            paywall: "analytics",
            from: "analytics-screen",
          });
        }}
        onClose={() => {
          navigation.navigate(RouteNames.Home);
        }}
        minTier={Tier.PRO}
      />
    </>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
    overflow: "hidden",
  },
  footer: (theme) => ({
    borderTopWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
  }),
  footerContent: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
});
