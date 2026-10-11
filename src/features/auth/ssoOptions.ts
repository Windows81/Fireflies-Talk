export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const NO_SSO_CONFIGURED_MESSAGE =
  "SSO is not configured for this email domain. Please contact your admin to set up SSO.";

const ERROR_MESSAGES: Record<string, string> = {
  NOT_FOUND_ERROR: NO_SSO_CONFIGURED_MESSAGE,
  BAD_USER_INPUT: "Please enter a valid work email address.",
  RATE_LIMIT_EXCEEDED: "Too many attempts. Please wait a moment and try again.",
  APOLLO_SHIELD_ERROR: "Too many attempts. Please wait a moment and try again.",
};

const FALLBACK_ERROR_MESSAGE = "Something went wrong. Please try again later.";

export const extractSsoErrorMessage = (error: unknown): string => {
  const code = (
    error as { graphQLErrors?: { extensions?: { code?: string } }[] }
  )?.graphQLErrors?.[0]?.extensions?.code;
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  return FALLBACK_ERROR_MESSAGE;
};
