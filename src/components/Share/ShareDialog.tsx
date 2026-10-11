import { createStyles, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { shareUrl } from "@/utils/share";
import { PortalHost } from "@gorhom/portal";
import { useState, type FC } from "react";
import { View } from "react-native";
import { Button, TextButton } from "../Button";
import { Dialog, type DialogProps } from "../Dialog";
import { ShareDialogEmail } from "./ShareDialogEmail";
import { SharePrivacyField } from "./SharePrivacyField";
import type { ShareDialogEmailProps, SharePrivacyFieldProps } from "./types";

interface ShareDialogProps {
  privacyProps?: SharePrivacyFieldProps;
  emailProps?: ShareDialogEmailProps;
  url: string;
  title: string;
}
const ShareDialogContent: FC<ShareDialogProps> = ({
  privacyProps,
  emailProps,
  url,
  title,
}) => {
  const theme = useTheme();
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  return (
    <>
      <Dialog.Header
        actions={
          emailProps ? (
            <TextButton
              disabled={selectedEmails.length === 0 || emailProps.loading}
              onPress={() => emailProps.onSubmit(selectedEmails)}
            >
              Invite
            </TextButton>
          ) : undefined
        }
      >
        Share
      </Dialog.Header>
      <View style={styles.main}>
        {emailProps && (
          <ShareDialogEmail
            {...emailProps}
            selectedEmails={selectedEmails}
            setSelectedEmails={setSelectedEmails}
          />
        )}
      </View>
      <View style={styles.footer(theme)}>
        {privacyProps && <SharePrivacyField {...privacyProps} />}
        <Button
          onPress={() => {
            shareUrl(url, title);
            tracker.track(TRACKING_EVENTS.SHARE_LINK_BUTTON_CLICKED, {
              url: url,
              privacy: privacyProps?.value,
            });
          }}
        >
          Share page link
        </Button>
      </View>
    </>
  );
};

export const ShareDialog: FC<
  ShareDialogProps & Omit<DialogProps, "variant">
> = ({ privacyProps, emailProps, url, title, ...props }) => {
  return (
    <Dialog.Root {...props} variant="fullscreen">
      <ShareDialogContent
        privacyProps={privacyProps}
        emailProps={emailProps}
        url={url}
        title={title}
      />
      <PortalHost name="ShareDialogPortalHost" />
    </Dialog.Root>
  );
};

const styles = createStyles({
  main: {
    flex: 1,
  },
  footer: (theme) => ({
    padding: 24,
    backgroundColor: theme.colors.layerSubtle,
    gap: 20,
  }),
});
