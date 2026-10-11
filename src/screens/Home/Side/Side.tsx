import {
  IconGoogleCalendar,
  IconLogo,
  IconOutlook,
  IconPlus,
} from "@/assets/svg";
import { Button } from "@/components/Button";
import { RefreshControl } from "@/components/RefreshControl";
import { Text } from "@/components/Typography";
import type { CalendarEventsProps } from "@/features/calendar";
import { useOpenAddModal } from "@/features/global-modals";
import type { MeetingStatusData } from "@/graphql";
import { useGetCurrentUserQuery } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { pluralize } from "@/utils/pluralize";
import { useScrollToTop } from "@react-navigation/native";
import type { PropsWithChildren } from "react";
import { useRef, type FC } from "react";
import { ScrollView, View } from "react-native";
import { AutoJoinSettingSection } from "../Settings/AutoJoinSettingSection";
import {
  LanguageSettingSection,
  LanguageSettingSectionLoading,
} from "../Settings/LanguageSettingSection";
import { SendNotesToSection } from "../Settings/SendNotesToSetting";
import { SettingSectionLoading } from "../Settings/SettingSectionLoading";
import { LiveMeetings } from "../UpcomingMeetings/LiveMeetings";
import { UpcomingMeetings } from "../UpcomingMeetings/UpcomingMeetings";

export interface SideProps extends CalendarEventsProps {
  liveMeetings: MeetingStatusData[];
}

const SideCard: FC<
  PropsWithChildren<{
    headerIcon: React.ReactNode;
    headerTitle: string;
    headerAction?: React.ReactNode;
    footer?: React.ReactNode;
  }>
> = ({ headerIcon, headerAction, headerTitle, children, footer }) => {
  const theme = useTheme();

  return (
    <View style={styles.card(theme)}>
      <View style={styles.cardHeader(theme)}>
        <View style={styles.cardHeaderLeading}>
          {headerIcon}
          <Text variant="title3Weight" color="textSecondary">
            {headerTitle}
          </Text>
        </View>
        {headerAction}
      </View>
      <View style={styles.cardContent}>{children}</View>
      {footer && <View style={styles.footer(theme)}>{footer}</View>}
    </View>
  );
};

export const SideContent: FC<SideProps> = (calendarEventsProps) => {
  const { liveMeetings, events } = calendarEventsProps;

  const { data: dataUser } = useGetCurrentUserQuery();
  const openAddModal = useOpenAddModal();

  const user = dataUser?.user;

  const calendarIcon = user?.profile?.isOutlook ? (
    <IconOutlook width={24} height={24} />
  ) : (
    <IconGoogleCalendar width={24} height={24} />
  );

  return (
    <>
      <SideCard
        headerIcon={calendarIcon}
        headerTitle={`${events?.length ? `${events.length} ` : ""} ${pluralize("Meeting", events?.length || 0)}`}
        headerAction={
          openAddModal ? (
            <Button
              aria-label="Add meeting"
              onPress={() => {
                openAddModal("home/upcoming-meetings/header");
              }}
              Icon={IconPlus}
              variant="transparentNeutral"
              style={styles.addButton}
            />
          ) : undefined
        }
      >
        {liveMeetings.length > 0 && <LiveMeetings meetings={liveMeetings} />}
        <UpcomingMeetings {...calendarEventsProps} />
      </SideCard>
      <SideCard
        headerIcon={<IconLogo width={24} height={24} />}
        headerTitle="Fireflies Notetaker"
        footer={
          user ? (
            <LanguageSettingSection user={user} />
          ) : (
            <LanguageSettingSectionLoading />
          )
        }
      >
        {user ? (
          <>
            <AutoJoinSettingSection user={user} />
            <SendNotesToSection user={user} />
          </>
        ) : (
          <>
            <SettingSectionLoading />
            <SettingSectionLoading />
          </>
        )}
      </SideCard>
    </>
  );
};

export const SideView: FC<
  SideProps & {
    ListHeaderComponent?: React.ReactElement;
  }
> = ({ ListHeaderComponent, ...calendarEventsProps }) => {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl onRefresh={calendarEventsProps.refetch} />
      }
    >
      {ListHeaderComponent}
      <SideContent {...calendarEventsProps} />
    </ScrollView>
  );
};

const styles = createStyles({
  container: {
    paddingBottom: 64,
    gap: 20,
  },
  cardHeaderLeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardContent: {
    padding: 20,
    flexDirection: "column",
    gap: 20,
  },
  addButton: {
    maxHeight: 25,
    width: 40,
  },
  card: (theme) => ({
    flexDirection: "column",
    backgroundColor: theme.colors.layerDefault,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticDefault,
    overflow: "hidden",
  }),
  cardHeader: (theme) => ({
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomColor: theme.colors.borderStaticDefault,
    borderBottomWidth: 1,
  }),
  footer: (theme) => ({
    flexDirection: "row",
    padding: 20,
    gap: 12,
    alignItems: "flex-start",
    backgroundColor: theme.colors.layerSubtle,
  }),
});
