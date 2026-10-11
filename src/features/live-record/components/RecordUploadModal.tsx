import { IconUpload } from "@/assets/svg";
import { Button, LinkButton } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { Select, TextInput } from "@/components/Input";
import { toast } from "@/components/Toast";
import { Text } from "@/components/Typography";
import { RouteNames } from "@/constants";
import { captureException } from "@/errors";
import { useLanguageOptions } from "@/features/language";
import { useFindLanguageBest } from "@/features/remote-constants";
import { uploadApi } from "@/features/upload";
import { apolloClient, useGetCurrentUserQuery } from "@/graphql";
import { useTheme } from "@/styles";
import { useBooleanState } from "@/utils/states";
import { UpdateMeetingDocument } from "@firefliesai/mobile-ff.graphql-client";
import type { Dispatch, FC, SetStateAction } from "react";
import { createContext, useCallback, useContext, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ensureRecordingMeetingId } from "../ensure-upload";
import { localRecordStoreApi } from "../local-record.store";
import type { RecordingContext } from "../types";

export const RecordUploadModalContext = createContext(
  {} as {
    uploadIntent: RecordingContext | null;
    setUploadIntent: Dispatch<SetStateAction<RecordingContext | null>>;
  },
);

export const useRecordUploadModalContext = () =>
  useContext(RecordUploadModalContext);

const RecordUploadModalContent: FC<{
  close: () => void;
  onUpload: () => void;
  uploadIntent: RecordingContext | null;
}> = ({ close, onUpload, uploadIntent }) => {
  const [title, setTitle] = useState(() => uploadIntent?.title || "");
  const languageOptions = useLanguageOptions();
  const findLanguageBest = useFindLanguageBest();

  const [isDoingUpload, setIsDoingUpload] = useState(false);

  const { data: dataUser } = useGetCurrentUserQuery();

  const [language, setLanguage] = useState(
    () =>
      (dataUser?.user?.preferredLanguage &&
        findLanguageBest(dataUser.user.preferredLanguage)?.code) ||
      "en",
  );

  const doUpload = useCallback(async () => {
    if (!uploadIntent) return;

    const meetingTitle = title.trim();
    if (!meetingTitle) return;

    try {
      if (isDoingUpload) return;

      setIsDoingUpload(true);

      const fileUri = uploadIntent.fileUri;

      localRecordStoreApi.updateByUri(fileUri, {
        title: meetingTitle,
      });

      let { meetingId } = uploadIntent;

      if (!meetingId) {
        meetingId = await ensureRecordingMeetingId({
          ...uploadIntent,
          fileUri,
          title: meetingTitle,
          language,
        });
      } else {
        try {
          // can't call this async because media-storage may start processing with the old value
          await apolloClient.mutate({
            mutation: UpdateMeetingDocument,
            variables: {
              id: meetingId,
              title: meetingTitle,
              notesPrivacy: uploadIntent.notesPrivacy,
              customLanguage: language,
            },
          });
        } catch (err) {
          captureException(err, {
            contexts: {
              uploadIntent: {
                ...uploadIntent,
              },
            },
            tags: {
              section: "record-upload",
            },
          });
        }
      }

      await uploadApi.create(fileUri, {
        title: meetingTitle,
        meetingId,
        uploadType: "recording",
        durationMillis: uploadIntent.durationMillis,
        onCompleted() {
          localRecordStoreApi.updateByUri(fileUri, {
            uploaded: true,
          });
        },
        onError(err) {
          toast({
            title: "Could not upload recording",
            message: err.message,
            type: "error",
          });
        },
      });

      close();

      // https://github.com/facebook/react-native/issues/47694
      setTimeout(() => {
        onUpload();
      }, 1000);
    } catch (err) {
      toast({
        message: (err as Error).message,
        type: "error",
      });
      captureException(err, {
        contexts: {
          uploadIntent: {
            ...uploadIntent,
          },
        },
        tags: {
          section: "record-upload",
        },
      });
    } finally {
      setIsDoingUpload(false);
    }
  }, [uploadIntent, close, title, onUpload, isDoingUpload, language]);

  return (
    <View style={styles.root}>
      <Text fontWeight="500" fontSize={16} style={styles.title}>
        {uploadIntent?.usingStream ? "Meeting details" : "Upload recording"}
      </Text>
      <Text variant="body2Regular" color="textHint">
        Meeting title:
      </Text>
      <TextInput value={title} onValueChange={setTitle} autoFocus />
      <View style={styles.languageContainer}>
        <Text variant="body2Regular" color="textHint">
          Meeting Language:
        </Text>
        <Select
          value={language}
          onValueChange={setLanguage}
          options={languageOptions}
          showSearch
        />
      </View>
      <View style={styles.buttons}>
        <Button variant="secondary" style={styles.button} onPress={close}>
          Cancel
        </Button>
        <Button
          style={styles.button}
          onPress={doUpload}
          disabled={isDoingUpload}
        >
          {uploadIntent?.usingStream ? "Save" : "Upload"}
        </Button>
      </View>
    </View>
  );
};

export const RecordUploadModal: FC = () => {
  const { uploadIntent, setUploadIntent } = useRecordUploadModalContext();

  const close = useCallback(() => setUploadIntent(null), [setUploadIntent]);

  const [successBannerIsOpen, openSuccessBanner, closeSuccessBanner] =
    useBooleanState();

  const theme = useTheme();

  return (
    <>
      <Dialog.Root variant="bottomSheet" isOpen={!!uploadIntent} close={close}>
        <RecordUploadModalContent
          close={close}
          onUpload={openSuccessBanner}
          uploadIntent={uploadIntent}
        />
      </Dialog.Root>
      <Dialog.Root
        variant="bottomSheet"
        isOpen={successBannerIsOpen}
        close={closeSuccessBanner}
      >
        <View style={styles.success}>
          <IconUpload
            width={24}
            height={24}
            color={theme.colors.textSecondary}
          />
          <Text variant="title1Regular">Your recording is being uploaded</Text>
          <Text variant="label2Regular" color="textMuted">
            Please keep the app open until it is done
          </Text>
          <Dialog.Actions>
            <Button onPress={closeSuccessBanner} variant="outlined">
              Done
            </Button>
            <LinkButton
              onPress={closeSuccessBanner}
              href={RouteNames.MeetingStatus}
            >
              View Status
            </LinkButton>
          </Dialog.Actions>
        </View>
      </Dialog.Root>
    </>
  );
};

const styles = StyleSheet.create({
  languageContainer: {
    marginTop: 24,
    gap: 12,
    width: "100%",
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
  },
  root: {
    padding: 24,
    paddingBottom: 12,
    gap: 12,
  },
  buttons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 32,
  },
  button: {
    flex: 1,
  },
  success: {
    padding: 24,
    paddingBottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
});
