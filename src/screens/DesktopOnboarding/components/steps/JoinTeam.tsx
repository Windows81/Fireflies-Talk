import { Avatar } from "@/components/Avatar";
import { Text } from "@/components/Typography";
import { toast } from "@/components/Toast";
import {
  EnumOnboardingStep,
  EnumTeamOnboardingSuggestionType,
  useRequestToJoinTeamMutation,
} from "@/graphql";
import { createStyles, Fonts } from "@/styles";
import { DESKTOP_THEME } from "@/styles/color";
import type { FC } from "react";
import { useCallback, useRef, useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import {
  getTeammateFirstName,
  hasCustomTeamName,
} from "../../helpers/teamHelpers";
import { useGetTeamOnboardingSuggestion } from "../../hooks/useGetTeamOnboardingSuggestion";
import { useCompleteOnboardingStep } from "../../hooks/useCompleteOnboardingStep";

export const DesktopJoinTeam: FC = () => {
  const { completeStep } = useCompleteOnboardingStep();
  const { teamOnboardingSuggestion } = useGetTeamOnboardingSuggestion();
  const [requestedTeamId, setRequestedTeamId] = useState<string | null>(null);
  const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null);
  const joiningTeamIdRef = useRef<string | null>(null);

  const [requestToJoinTeam, { loading }] = useRequestToJoinTeamMutation({
    onCompleted() {
      const teamId = joiningTeamIdRef.current;
      if (teamId) setRequestedTeamId(teamId);
      toast({
        message: "Request sent",
        type: "success",
      });
      completeStep({
        step: EnumOnboardingStep.TeamOnboarding,
        skip: false,
        extraInfo: {
          suggestion: EnumTeamOnboardingSuggestionType.RequestTeams,
        },
      });
    },
    onError(err) {
      setJoiningTeamId(null);
      toast({
        title: "Could not join team",
        message: err.message,
        type: "error",
      });
    },
  });

  const handleJoin = useCallback(
    (teamId: string) => {
      joiningTeamIdRef.current = teamId;
      setJoiningTeamId(teamId);
      requestToJoinTeam({
        variables: {
          teamId,
          source: "desktop-onboarding",
        },
      }).finally(() => {
        joiningTeamIdRef.current = null;
        setJoiningTeamId(null);
      });
    },
    [requestToJoinTeam],
  );

  const teams = teamOnboardingSuggestion?.teams ?? [];
  const hasPendingRequest =
    requestedTeamId != null || teams.some((t) => t.isRequested);

  return (
    <View style={styles.optionsContainer}>
      {hasPendingRequest && (
        <View style={styles.pendingBanner}>
          <Text style={styles.pendingBannerTitle}>Request pending</Text>
          <Text style={styles.pendingBannerMessage}>
            You already have a pending request to join this team
          </Text>
        </View>
      )}
      <View style={styles.listContainer}>
        <FlatList
          data={teams}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const isRequested = item.isRequested || requestedTeamId === item.id;
            const isThisJoining = loading && joiningTeamId === item.id;
            const isAnyJoinInProgress = loading;
            const joinDisabled = isAnyJoinInProgress || hasPendingRequest;

            return (
              <View key={item.id}>
                <View style={styles.row}>
                  <Avatar
                    name={item.admin.name ?? ""}
                    picture={item.admin.profile?.picture}
                    size={24}
                    shape="square"
                  />
                  <View style={styles.info}>
                    <Text variant="body2Regular" color="commandNeutralDefault">
                      {hasCustomTeamName(item)
                        ? item.name
                        : `${getTeammateFirstName(item.admin) || "Unknown"}'s Team`}
                    </Text>
                    <Text variant="body2Regular" color="textHint">
                      {item.admin.name ?? ""} and {item.teamSize - 1} others
                    </Text>
                  </View>
                  {isRequested ? (
                    <Text style={styles.requestedText}>Requested</Text>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        joinDisabled && styles.actionButtonDisabled,
                      ]}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Join team"
                      onPress={() => handleJoin(item.id)}
                      disabled={joinDisabled}
                    >
                      <Text style={styles.actionButtonText}>
                        {isThisJoining ? "Joining…" : "Join"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                {index < teams.length - 1 ? (
                  <View style={styles.divider} />
                ) : null}
              </View>
            );
          }}
        />
      </View>
    </View>
  );
};

const styles = createStyles({
  optionsContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    height: "100%",
    flex: 1,
    gap: 24,
  },
  pendingBanner: {
    width: "100%",
    maxWidth: 432,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: DESKTOP_THEME.red50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.red200,
    gap: 4,
  },
  pendingBannerTitle: {
    color: DESKTOP_THEME.grey1200,
    fontSize: 14,
    fontFamily: Fonts.dmSans["700"].regular,
  },
  pendingBannerMessage: {
    color: DESKTOP_THEME.grey700,
    fontSize: 12,
    fontFamily: Fonts.dmSans["400"].regular,
  },
  listContainer: {
    width: "100%",
    maxWidth: 432,
    maxHeight: 270,
    backgroundColor: DESKTOP_THEME.grey1000,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.grey900,
  },
  card: {
    width: "100%",
    maxWidth: 432,
    backgroundColor: DESKTOP_THEME.grey1000,
    borderRadius: 8,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  info: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 2,
  },
  teamName: {
    color: DESKTOP_THEME.grey100,
    fontSize: 14,
    fontFamily: Fonts.dmSans["500"].regular,
  },
  memberCount: {
    color: DESKTOP_THEME.grey500,
    fontSize: 12,
    fontFamily: Fonts.dmSans["400"].regular,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: DESKTOP_THEME.grey900,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: DESKTOP_THEME.grey800,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: DESKTOP_THEME.grey100,
    fontSize: 14,
    fontFamily: Fonts.dmSans["500"].regular,
  },
  requestedText: {
    color: DESKTOP_THEME.purple400,
    fontSize: 14,
    fontFamily: Fonts.dmSans["500"].regular,
  },
  divider: {
    height: 1,
    backgroundColor: DESKTOP_THEME.grey800,
    width: "95%",
    alignSelf: "center",
  },
});
