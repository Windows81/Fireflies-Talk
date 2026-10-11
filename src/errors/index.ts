export {
  isAuthExpiredError,
  isForbiddenError,
  isNotFoundError,
  isUnauthenticatedError,
  shouldRetryError,
} from "./auth";
export { CanceledError, NetworkError } from "./error";
export {
  addBreadcrumb as addSentryBreadcrumb,
  captureException,
  setContext as setSentryContext,
  setTag as setSentryTag,
  setUser as setSentryUser,
} from "./sentry";
export { getErrorMessage, getResponseErrorMessage } from "./utils";
import { sentryConfig } from "./config";
import { init as initSentry } from "./sentry";

export const initErrorHandling = () => {
  initSentry(sentryConfig);
};
