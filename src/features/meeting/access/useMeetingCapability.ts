import { useTeam } from "@/features/team";
import { Capability, useMyCapabilityQuery } from "@/graphql";
import { computeCapabilityDenied } from "./computeCapabilityDenied";
import { useAdminControlsEnabled } from "./useAdminControlsEnabled";

export const useMeetingCapability = (
  capability: Capability | undefined,
  meetingId: string | undefined,
) => {
  const { team, teamLoading, error: teamError } = useTeam();
  const teamId = team?._id;
  const enabled = useAdminControlsEnabled();
  const skip = !enabled || !teamId || !meetingId || !capability;

  const { data, loading, error } = useMyCapabilityQuery({
    variables: {
      teamId: teamId ?? "",
      capability: capability ?? Capability.MeetingDownload,
      resource: { meetingId: meetingId ?? "" },
    },
    skip,
    fetchPolicy: "cache-and-network",
  });

  const denied = computeCapabilityDenied({
    enabled,
    skip,
    hasTarget: !!meetingId && !!capability,
    teamLoading,
    teamError: !!teamError,
    loading,
    hasError: !!error,
    allowed: data?.myCapability?.allowed,
  });

  return { denied, loading: loading || teamLoading };
};
