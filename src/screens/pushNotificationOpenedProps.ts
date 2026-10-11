export const buildPushNotificationOpenedProps = ({
  payload,
  fromBackground,
  deepLinkType,
}: {
  payload: Record<string, any>;
  fromBackground: boolean;
  deepLinkType: string | null;
}) => ({
  templateId: payload.tId,
  fromBackground,
  ...(deepLinkType && { deepLinkType }),
  ...(typeof payload.mId === "string" && { messageId: payload.mId }),
});
