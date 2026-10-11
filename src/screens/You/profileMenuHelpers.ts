import { pluralize } from "@/utils/pluralize";

export interface StorageMetrics {
  minutesConsumed: number;
  tierLimit: number;
  isInfinity: boolean;
  subtraction: number;
  above: number;
  isAbove: boolean;
}

export interface ProfileMenuProfile {
  picture?: string;
  pictureUrl?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
}

const formatNumberWithAbbreviation = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
};

export const getUserName = (profile?: ProfileMenuProfile): string => {
  if (!profile) return "Unnamed";

  // First try firstName
  if (profile.firstName) return profile.firstName;

  // If no firstName, split the name by whitespace and get the first part
  if (profile.name) {
    const firstName = profile.name.split(/\s+/)[0];
    return firstName || profile.name;
  }

  // Fallback to lastName or "Unnamed"
  return profile.lastName || "Unnamed";
};

export const calculateStorageMetrics = ({
  _minutesConsumed,
  tierLimit,
  isInfinity,
}: {
  _minutesConsumed?: number | null;
  tierLimit?: number | null;
  isInfinity?: boolean | null;
}): StorageMetrics => {
  const minutesConsumed = Number(_minutesConsumed?.toFixed(2) || 0);
  const limit = tierLimit || 0;
  const subtraction = Number((limit - minutesConsumed).toFixed(0));
  const above = Math.max(0, -subtraction);
  const isAbove = subtraction < 0;

  return {
    minutesConsumed,
    tierLimit: limit,
    isInfinity: isInfinity || false,
    subtraction,
    above,
    isAbove,
  };
};

export const getStorageSubtext = (
  isAbove: boolean,
  above: number,
  subtraction: number,
  tierLimit: number,
): string => {
  return `${formatNumberWithAbbreviation(isAbove ? above : subtraction)} ${
    isAbove
      ? "mins above plan limit"
      : ` left / ${formatNumberWithAbbreviation(tierLimit)} mins`
  }`;
};

export const getMeetingsCreditsSubtext = (
  freeMeetingsLeft: number,
  limit: number,
): string => {
  return `${formatNumberWithAbbreviation(freeMeetingsLeft)} left / ${formatNumberWithAbbreviation(limit)} free ${pluralize("meeting", limit)}`;
};

export const getAICreditsSubtext = (
  monthlyPromptsLimit: number,
  monthlyPromptsUsed: number,
): string => {
  const creditsUsed = monthlyPromptsUsed || 0;
  return `${formatNumberWithAbbreviation(creditsUsed)} used / ${formatNumberWithAbbreviation(monthlyPromptsLimit)} ${pluralize("credit", monthlyPromptsLimit)}`;
};

export const getStoragePercentage = (
  subtraction: number,
  tierLimit: number,
): number => {
  if (!tierLimit) return 0;
  return Math.min((subtraction / tierLimit) * 100, 100);
};

export const getAICreditsPercentage = (
  monthlyPromptsLimit: number,
  monthlyPromptsUsed: number,
): number => {
  if (!monthlyPromptsLimit) return 0;
  const monthlyPromptsLeft = monthlyPromptsLimit - (monthlyPromptsUsed || 0);
  return Math.min((monthlyPromptsLeft / monthlyPromptsLimit) * 100, 100);
};

export const getMeetingCreditsPercentage = (
  freeMeetingsLeft: number,
  limit: number,
): number => {
  if (!limit) return 0;
  return Math.min((freeMeetingsLeft / limit) * 100, 100);
};

export const shouldShowGetAICreditsButton = (
  isPaidUser: boolean,
  monthlyPromptsLimit: number,
  monthlyPromptsUsed: number,
): boolean => {
  if (!isPaidUser) return false;
  const creditsLeft = monthlyPromptsLimit
    ? Math.max(monthlyPromptsLimit - monthlyPromptsUsed, 0)
    : 0;
  return creditsLeft > 0;
};
