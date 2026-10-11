import { Config } from "@/constants";

export const getRequestMetadataHeaders = () => {
  const transactionId = Math.random().toString(36).substr(2, 9);
  return {
    "x-request-id": transactionId,
    "x-client-name": Config.APP_NAME,
    "x-client-version": Config.VERSION,
  };
};
