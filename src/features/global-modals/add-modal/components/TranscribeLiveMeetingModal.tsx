import { IconCheck, IconLink } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { SelectField, TextField } from "@/components/Input";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { useLanguageOptions } from "@/features/language";
import { useFindLanguageBest } from "@/features/remote-constants";
import {
  useCreateMeetingInMediaStorageWithUrlMutation,
  useGetCurrentUserQuery,
} from "@/graphql";
import { TRACKING_EVENTS, tracker } from "@/tracking";
import { isUrlSupportedSafe } from "@firefliesai/shared-libs.utils";
import { format } from "date-fns";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const getDefaultTitle = (startTime: Date) => {
  return format(startTime, "MMM dd, hh:mm aa");
};

const TranscribeLiveMeetingModalContent: FC = () => {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
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

  const [createMeeting, { loading, data }] =
    useCreateMeetingInMediaStorageWithUrlMutation({
      onCompleted({ createMeetingInMediaStorageWithURL }, options) {
        tracker.track(TRACKING_EVENTS.ADD_TOLIVE_MEETING_SUBMITTED, {
          url: options?.variables?.url,
          liveMeeting: createMeetingInMediaStorageWithURL?.meeting,
        });

        if (!createMeetingInMediaStorageWithURL?.meeting) {
          toast({
            title: "Could not add to meeting",
            message: "Something went wrong",
            type: "error",
          });
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
          <IconCheck color="#ffffff" />
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
      <Text color="textSecondary">
        Fireflies notetaker assistant will be added to the meeting.
      </Text>
      <TextField
        label="Name your meeting (Optional)"
        value={title}
        onValueChange={setTitle}
      />
      <TextField
        label="Meeting link"
        description="Capture meetings from GMeet, Zoom, MS teams, and more."
        Icon={IconLink}
        value={url}
        onValueChange={setUrl}
      />
      <SelectField
        label="Meeting Language"
        onValueChange={setLanguage}
        value={language}
        options={languageOptions}
      />
      <Button
        style={styles.button}
        disabled={!url.trim() || loading}
        onPress={onSubmit}
      >
        Invite Fireflies
      </Button>
    </>
  );
};

export const TranscribeLiveMeetingModal: FC<{
  isOpen: boolean;
  close: () => void;
}> = ({ isOpen, close }) => {
  return (
    <Dialog.Root variant="bottomSheet" isOpen={isOpen} close={close}>
      <Dialog.Header>Add to live meeting</Dialog.Header>
      <View style={styles.root}>
        <TranscribeLiveMeetingModalContent />
      </View>
    </Dialog.Root>
  );
};

const styles = StyleSheet.create({
  root: {
    gap: 12,
    padding: 20,
  },
  button: {
    marginTop: 8,
  },
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
