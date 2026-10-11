export const computeCapabilityDenied = (input: {
  enabled: boolean;
  skip: boolean;
  hasTarget: boolean;
  teamLoading: boolean;
  teamError: boolean;
  loading: boolean;
  hasError: boolean;
  allowed: boolean | undefined;
}): boolean => {
  const {
    enabled,
    skip,
    hasTarget,
    teamLoading,
    teamError,
    loading,
    hasError,
    allowed,
  } = input;
  if (!enabled) return false;
  // Trust an existing decision (allow or deny) even while either query
  // revalidates under cache-and-network, so a warm remount does not flash.
  if (allowed !== undefined) return allowed !== true;
  // No decision yet: fail closed while the team or capability query is in
  // flight or errored, rather than skipping (which would expose the action).
  if (hasTarget && (teamLoading || teamError)) return true;
  if (skip) return false;
  if (loading) return true;
  if (hasError) return true;
  return true;
};
