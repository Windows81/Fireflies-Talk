import { captureException, getErrorMessage } from "@/errors";
import { apolloClient } from "@/graphql";
import { Logger } from "@/logger";
import { getFileInfo } from "@/utils/file";
import { patchAndroidMimeType } from "@/utils/mime";
import type {
  Meeting,
  MeetingAttendeeInput,
  MeetingNotesPrivacy,
} from "@firefliesai/mobile-ff.graphql-client";
import { CreateMeetingDocument } from "@firefliesai/mobile-ff.graphql-client";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { GraphQLError } from "graphql";
import { Alert, Linking, Platform } from "react-native";
import { supportedMimeType, UPLOAD_CLIENT_KEYS } from "./constants";
import { uploadApi } from "./store";
import type { UploadTaskDetail } from "./types";
import { validateFile } from "./utils";
import { isDesktop } from "@/utils/device";

const logger = new Logger("upload-service");

export async function createMeetingForUpload({
  title,
  notesPrivacy,
  startTime,
  endTime,
  client,
  customLanguage,
  enableRealtime,
  iCalUID,
  attendees,
}: {
  title: string;
  notesPrivacy?: MeetingNotesPrivacy;
  client: string;
  startTime?: Date;
  endTime?: Date;
  customLanguage?: string;
  enableRealtime?: boolean;
  iCalUID?: string;
  attendees?: MeetingAttendeeInput[];
}) {
  logger.info("creating meeting for upload", {
    title,
    notesPrivacy,
    startTime,
    endTime,
    enableRealtime,
    iCalUID,
  });

  const result = await apolloClient.mutate({
    mutation: CreateMeetingDocument,
    variables: {
      title,
      notesPrivacy,
      startTime,
      endTime,
      client,
      customLanguage,
      enableRealtime,
      iCalUID,
      attendees,
    },
  });

  if (result.errors?.length) {
    throw new GraphQLError(result.errors[0].message, {
      ...result.errors[0],
    });
  }

  logger.info("meeting created", { id: result.data?.createMeeting?.id });

  return result.data?.createMeeting as Meeting;
}

async function validateAndUpload({
  uri,
  fileName,
  fileSize,
  assetMimeType,
  notesPrivacy,
  options,
}: {
  uri: string;
  fileName: string;
  fileSize: number | null | undefined;
  assetMimeType: string | undefined;
  notesPrivacy?: MeetingNotesPrivacy;
  options?: {
    onError?: (error: Error) => void;
    onCompleted?: (task: UploadTaskDetail) => void;
  };
}) {
  const info =
    typeof fileSize === "number" && assetMimeType
      ? {
          mimeType: assetMimeType,
          size: fileSize,
        }
      : await getFileInfo(uri, {
          name: fileName,
          mimeType: assetMimeType,
        });

  await validateFile(info);

  const meeting = await createMeetingForUpload({
    title: fileName,
    notesPrivacy,
    client: isDesktop
      ? UPLOAD_CLIENT_KEYS.DESKTOP_UPLOAD
      : UPLOAD_CLIENT_KEYS.MOBILE_UPLOAD,
  });

  await uploadApi.create(
    {
      uri,
      mimeType: info.mimeType,
      size: info.size,
    },
    {
      meetingId: meeting.id,
      title: fileName,
      ...options,
    },
  );

  return { uploaded: true, mimeType: info.mimeType };
}

export async function uploadFromDocument(
  {
    notesPrivacy,
    mimeType,
  }: {
    notesPrivacy?: MeetingNotesPrivacy;
    mimeType?: string | string[];
  },
  options?: {
    onError?: (error: Error) => void;
    onCompleted?: (task: UploadTaskDetail) => void;
  },
) {
  const result = await DocumentPicker.getDocumentAsync({
    type: mimeType ?? (Platform.OS === "ios" ? "*/*" : supportedMimeType),
    multiple: false,
    copyToCacheDirectory: true,
  }).catch((err) => {
    captureException(
      new Error(getErrorMessage(err, "DocumentPicker.getDocumentAsync")),
      {
        tags: {
          section: "upload-from-document",
        },
      },
    );
    throw err;
  });
  if (result.canceled) return { uploaded: false, mimeType: "" };
  const asset = result.assets[0];
  if (!asset) return { uploaded: false, mimeType: "" };

  const assetMimeType = asset.mimeType
    ? patchAndroidMimeType(asset.mimeType, [asset.uri, asset.name])
    : undefined;

  return validateAndUpload({
    uri: asset.uri,
    fileName: asset.name,
    fileSize: asset.size,
    assetMimeType,
    notesPrivacy,
    options,
  });
}

export async function uploadFromGallery(
  {
    notesPrivacy,
  }: {
    notesPrivacy?: MeetingNotesPrivacy;
  },
  options?: {
    onError?: (error: Error) => void;
    onCompleted?: (task: UploadTaskDetail) => void;
  },
) {
  const permissionResult =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissionResult.granted) {
    if (permissionResult.canAskAgain === false) {
      Alert.alert(
        "Permission required",
        "Permission to access the media library is required to select files. Please enable it in Settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ],
      );
    } else {
      Alert.alert(
        "Permission required",
        "Permission to access the media library is required to select files.",
      );
    }
    return { uploaded: false, mimeType: "" };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["videos"],
    allowsEditing: false,
    shouldDownloadFromNetwork: true,
    videoQuality: ImagePicker.UIImagePickerControllerQualityType.IFrame1280x720,
  }).catch((err) => {
    captureException(
      new Error(getErrorMessage(err, "ImagePicker.launchImageLibraryAsync")),
      {
        tags: {
          section: "upload-from-gallery",
        },
      },
    );
    throw err;
  });

  if (result.canceled) return { uploaded: false, mimeType: "" };
  const asset = result.assets[0];
  if (!asset) return { uploaded: false, mimeType: "" };

  const fileName = asset.fileName ?? asset.uri.split("/").pop() ?? "upload";

  const assetMimeType = asset.mimeType
    ? patchAndroidMimeType(asset.mimeType, [asset.uri, fileName])
    : undefined;

  return validateAndUpload({
    uri: asset.uri,
    fileName,
    fileSize: asset.fileSize,
    assetMimeType,
    notesPrivacy,
    options,
  });
}
