type ErrorLike = {
  message?: string;
  extensions?: {
    code?: string;
    response?: {
      status?: number;
    };
  };
};

const asErrorLike = (error: unknown): ErrorLike | null => {
  if (typeof error === "string") {
    return { message: error };
  }

  return error && typeof error === "object" ? (error as ErrorLike) : null;
};

const getNormalizedMessage = (error: unknown) =>
  asErrorLike(error)?.message?.toLowerCase();

export const isAuthExpiredError = (error: unknown) => {
  const value = asErrorLike(error);

  return (
    value?.extensions?.code === "TokenExpiredError" ||
    getNormalizedMessage(value)?.includes("token expired")
  );
};

// Server error classes reported in extensions.code: dashboard-ff uses the
// screaming-case codes from ssr/statusCode.js, other services the class name.
const FORBIDDEN_CODES = ["FORBIDDEN", "ForbiddenError"];
const UNAUTHENTICATED_CODES = [
  "UNAUTHENTICATED",
  "UnauthenticatedError",
  "invalid_token",
];

// Only consulted for errors that carry no server error code.
const SESSION_MESSAGES = [
  "authentication",
  "must be logged in",
  "unauthenticated",
  "invalid token",
  "token is invalid",
  "invalid credentials",
  "invalid authorization",
];

const hasSessionMessage = (error: unknown) => {
  const message = getNormalizedMessage(asErrorLike(error));

  return SESSION_MESSAGES.some((pattern) => message?.includes(pattern));
};

export const isUnauthenticatedError = (error: unknown) => {
  const value = asErrorLike(error);
  const code = value?.extensions?.code;

  if (code && UNAUTHENTICATED_CODES.includes(code)) {
    return true;
  }

  // A rejected or expired session token always arrives as UNAUTHENTICATED, so a
  // FORBIDDEN response never describes a session the client can recover.
  if (code && FORBIDDEN_CODES.includes(code)) {
    return false;
  }

  return (
    hasSessionMessage(value) ||
    value?.extensions?.response?.status === 401 ||
    value?.message?.includes("401")
  );
};

export const isForbiddenError = (error: unknown) => {
  const value = asErrorLike(error);
  const message = getNormalizedMessage(value);
  const code = value?.extensions?.code;

  if (code && FORBIDDEN_CODES.includes(code)) {
    return true;
  }

  return (
    message?.includes("forbidden") ||
    message?.includes("permission_denied") ||
    message?.includes("don't have permission") ||
    value?.extensions?.response?.status === 403 ||
    value?.message?.includes("403")
  );
};

export const isNotFoundError = (error: unknown) => {
  const value = asErrorLike(error);
  const message = getNormalizedMessage(value);

  return (
    value?.extensions?.code === "NotFoundError" ||
    message?.includes("not found") ||
    value?.extensions?.response?.status === 404 ||
    value?.message?.includes("404")
  );
};

export const shouldRetryError = (error: unknown) =>
  !isNotFoundError(error) &&
  !isForbiddenError(error) &&
  !isUnauthenticatedError(error);
