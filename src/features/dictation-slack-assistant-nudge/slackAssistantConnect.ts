import {
  SLACK_ASSISTANT_CONNECT_PATH,
  SLACK_ASSISTANT_CONNECT_SOURCE,
} from "./constants";

export const buildSlackAssistantConnectUrl = (dashboardUrl: string): string =>
  `${dashboardUrl.replace(/\/+$/, "")}${SLACK_ASSISTANT_CONNECT_PATH}?assistant=slack&source=${SLACK_ASSISTANT_CONNECT_SOURCE}&connect=1`;
