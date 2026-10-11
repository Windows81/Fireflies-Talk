import {
  IconCheck,
  IconGoogleMeetLogo,
  IconLink2,
  IconMsTeamsLogo,
  IconZoomLogo,
} from "@/assets/svg";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { SelectField, TextInput } from "@/components/Input";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { useLanguageOptions } from "@/features/language";
import { liveMeetingsApi } from "@/features/live";
import { meetingDetectionApi } from "@/features/desktop-meeting-detection";
import { useFindLanguageBest } from "@/features/remote-constants";
import {
  useCreateMeetingInMediaStorageWithUrlMutation,
  useGetCurrentUserQuery,
} from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { isUrlSupportedSafe } from "@firefliesai/shared-libs.utils";
import { format } from "date-fns";
import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import type { TextInput as RNTextInput } from "react-native";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export const getDefaultTitle = (startTime: Date) => {
  return format(startTime, "MMM dd, hh:mm aa");
};

interface DesktopInviteFredModalContentProps {
  prefilledUrl?: string;
  close: () => void;
  onInviteSuccess?: () => void;
}

const DesktopInviteFredModalContent: FC<DesktopInviteFredModalContentProps> = ({
  prefilledUrl,
  close,
  onInviteSuccess,
}) => {
  const theme = useTheme();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState(prefilledUrl || "");
  const urlInputRef = useRef<RNTextInput>(null);
  const languageOptions = useLanguageOptions();
  const findLanguageBest = useFindLanguageBest();

  const { data: dataUser } = useGetCurrentUserQuery();

  const [language, setLanguage] = useState(
    () =>
      (dataUser?.user?.preferredLanguage &&
        findLanguageBest(dataUser.user.preferredLanguage)?.code) ||
      "en",
  );

  useEffect(() => {
    if (dataUser?.user?.preferredLanguage) {
      const languageCode = findLanguageBest(
        dataUser.user.preferredLanguage,
      )?.code;
      if (languageCode) {
        setLanguage(languageCode);
      }
    }
  }, [dataUser?.user?.preferredLanguage, findLanguageBest]);

  // Focus the URL input on mount so the user can start typing immediately
  useEffect(() => {
    urlInputRef.current?.focus();
  }, []);

  const [createMeeting, { loading, data }] =
    useCreateMeetingInMediaStorageWithUrlMutation({
      onCompleted({ createMeetingInMediaStorageWithURL }, options) {
        tracker.track(TRACKING_EVENTS.ADD_TOLIVE_MEETING_SUBMITTED, {
          url: options?.variables?.url,
          liveMeeting: createMeetingInMediaStorageWithURL?.meeting,
          source: "desktop-invite-fred",
        });

        console.log(
          "createMeetingInMediaStorageWithURL",
          createMeetingInMediaStorageWithURL,
        );

        if (!createMeetingInMediaStorageWithURL?.meeting) {
          toast({
            title: "Could not add to meeting",
            message: "Something went wrong",
            type: "error",
          });
        } else {
          liveMeetingsApi.refetch();
          onInviteSuccess?.();

          // Track explicitly invited meeting ID so we auto-open live pane on SSE event
          const meetingId = (
            createMeetingInMediaStorageWithURL.meeting as {
              meeting?: string;
            }
          )?.meeting;
          if (meetingId) {
            meetingDetectionApi.addExplicitlyInvitedMeetingId(meetingId);
          }

          // Show bot invited notification
          window.electron?.notification?.show(
            "Fireflies notetaker invited",
            "The notetaker will join the meeting in few secs.",
            "",
            "",
            { showProgress: false, showCloseAlways: true, timeout: 3000 },
          );
        }
      },
      onError(err) {
        toast({
          title: "Could not add to meeting",
          message: err.message,
          type: "error",
        });
      },
    });

  const onSubmit = () => {
    // try to normalize the url
    let fixedUrl = url.trim();
    if (!fixedUrl.startsWith("http")) {
      fixedUrl = `https://${fixedUrl}`;
    }

    if (!isUrlSupportedSafe(fixedUrl)) {
      toast({
        title: "Invalid meeting link",
        message: "Enter a valid web conferencing URL.",
        type: "error",
      });
      return;
    }

    createMeeting({
      variables: {
        url: fixedUrl,
        title: title.trim() || getDefaultTitle(new Date()),
        customLanguage: language,
      },
    });
  };

  if (data?.createMeetingInMediaStorageWithURL?.meeting) {
    return (
      <Animated.View style={styles.success} entering={FadeInDown.duration(300)}>
        <View style={styles.successIcon}>
          <IconCheck color={theme.colors.textPrimary} />
        </View>
        <Text fontWeight="500" fontSize={18} style={styles.successText}>
          Fireflies assistant has been invited to the meeting
        </Text>
        <Text color="textHint" style={styles.successText}>
          Once joined, Fireflies notetaker assistant will automatically start
          taking notes.
        </Text>
      </Animated.View>
    );
  }

  return (
    <>
      {/* Meeting Link Section - Purple Card */}
      <View style={styles.meetingLinkCard}>
        <View style={styles.labelRow}>
          <Text style={styles.labelText} fontWeight="500">
            Meeting link
          </Text>
          <Text style={styles.descriptionText}>
            Add notetaker to your live meeting to capture and summarize.
          </Text>
        </View>
        <View style={styles.linkInput}>
          <IconLink2 width={20} height={20} color={theme.colors.textHint} />
          <TextInput
            ref={urlInputRef}
            style={styles.linkTextInput}
            value={url}
            onValueChange={setUrl}
          />
        </View>
        <View style={styles.platformIcons}>
          <IconGoogleMeetLogo />
          <IconZoomLogo />
          <IconMsTeamsLogo />
          <Text style={styles.moreText(theme)}>+6</Text>
        </View>
      </View>

      {/* Meeting Language */}
      <SelectField
        label="Meeting language"
        onValueChange={(newValue) => {
          setLanguage(newValue);
        }}
        value={language}
        options={languageOptions}
      />

      {/* Meeting Title */}
      <View style={styles.titleField}>
        <View style={styles.titleLabelRow}>
          <Text color="textPrimary" fontWeight="500" fontSize={14}>
            Meeting title
          </Text>
          <Text color={"commandNeutralDisabled"} fontSize={14}>
            {" "}
            (Optional)
          </Text>
        </View>
        <TextInput
          style={styles.titleInput(theme)}
          value={title}
          onValueChange={setTitle}
          placeholder="E.g. Product Team Sync"
        />
      </View>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <Button
          variant="secondary"
          size="sm"
          onPress={close}
          style={styles.cancelButton(theme)}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={!url.trim() || loading}
          onPress={onSubmit}
        >
          Start Capturing
        </Button>
      </View>
    </>
  );
};

export const DesktopInviteFredModal: FC<{
  isOpen: boolean;
  close: () => void;
  prefilledUrl?: string;
  onInviteSuccess?: () => void;
}> = ({ isOpen, close, prefilledUrl, onInviteSuccess }) => {
  return (
    <Dialog.Root variant="bottomSheet" isOpen={isOpen} close={close}>
      <Dialog.Header>Add to live meeting</Dialog.Header>
      <View style={styles.root}>
        <DesktopInviteFredModalContent
          key={prefilledUrl}
          prefilledUrl={prefilledUrl}
          close={close}
          onInviteSuccess={onInviteSuccess}
        />
      </View>
    </Dialog.Root>
  );
};

const styles = createStyles({
  root: {
    gap: 24,
    padding: 24,
    paddingTop: 0,
  },
  meetingLinkCard: {
    backgroundColor: "#351a75",
    borderRadius: 8,
    padding: 20,
    gap: 12,
  },
  labelRow: {
    gap: 4,
  },
  labelText: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 20,
  },
  descriptionText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    lineHeight: 20,
  },
  linkInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 4,
  },
  linkTextInput: {
    flex: 1,
    color: "rgba(255, 255, 255, 0.9)",
    backgroundColor: "transparent",
    borderWidth: 0,
    fontSize: 14,
    lineHeight: 20,
  },
  platformIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
  },
  moreText: (theme) => ({
    color: theme.colors.commandNeutralDisabled,
    fontSize: 14,
  }),
  titleField: {
    gap: 12,
  },
  titleLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleInput: (theme) => ({
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: theme.colors.interactiveSecondaryDefault,
    borderColor: theme.colors.borderStaticPage,
  }),
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelButton: (theme) => ({
    borderColor: theme.colors.borderStaticPage,
  }),
  success: {
    alignItems: "center",
    gap: 8,
  },
  successIcon: {
    backgroundColor: "rgb(55, 179, 78)",
    alignItems: "center",
    justifyContent: "center",
    width: 82,
    height: 82,
    borderRadius: 9999,
    borderWidth: 16,
    borderColor: "rgb(234, 251, 237)",
    marginBottom: 8,
  },
  successText: {
    textAlign: "center",
  },
});
