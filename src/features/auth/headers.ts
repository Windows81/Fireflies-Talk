export function createAuthHeaders(
  tokens: {
    accessToken: string | null;
    refreshToken?: string | null;
  } | null,
): Record<string, string> {
  if (!tokens) return {};
  return {
    ...(tokens.accessToken && {
      authorization: `Bearer ${tokens.accessToken}`,
    }),
    ...(tokens.refreshToken && {
      "x-refresh-token": tokens.refreshToken,
    }),
  };
}
