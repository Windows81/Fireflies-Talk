export const TOS_UPDATE_CUTOFF = new Date("2026-09-28T00:00:00.000Z");

interface TosUpdateVisibility {
  hasAcceptedTosUpdate2: boolean | null | undefined;
  createdAt: Date | string | null | undefined;
}

export function shouldShowTosUpdate({
  hasAcceptedTosUpdate2,
  createdAt,
}: TosUpdateVisibility): boolean {
  const createdOnOrAfterCutoff =
    createdAt != null && new Date(createdAt) >= TOS_UPDATE_CUTOFF;

  return hasAcceptedTosUpdate2 !== true && !createdOnOrAfterCutoff;
}
