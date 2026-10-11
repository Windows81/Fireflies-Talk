import { Config } from "@/constants";
import { CreateUserFileDocument, apolloClient } from "@/graphql";
import { getActualPlatform } from "@/utils/device";
import { getExtensionFromMimeType } from "@/utils/mime";
import {
  CompleteUploadDocument,
  StartUploadDocument,
} from "@firefliesai/mobile-ff.graphql-client";
import { isPaidUser } from "@firefliesai/payments-ff.utils";
import { useAuth } from "../auth";
import {
  audioFileSizeLimit,
  freeVideoFileSizeLimit,
  paidVideoFileSizeLimit,
  supportedMimeType,
} from "./constants";

export const validateFile = async (file: {
  mimeType: string;
  size: number;
}) => {
  const currentUser = useAuth.getState().user;
  const isUserPaid = !!currentUser && isPaidUser(currentUser.paidUser);

  const { mimeType, size } = file;

  const isSupported = supportedMimeType.some((supportedType) =>
    new RegExp(supportedType.replace("*", ".*")).test(mimeType),
  );
  if (!isSupported) {
    throw new Error("Unsupported file type");
  }

  const isVideo = mimeType.startsWith("video");
  const sizeLimit = isVideo
    ? isUserPaid
      ? paidVideoFileSizeLimit
      : freeVideoFileSizeLimit
    : audioFileSizeLimit;
  if (size > sizeLimit) {
    throw new Error("File size limit exceeded");
  }

  return {
    mimeType,
    isVideo,
    size,
  };
};

export const getUploadAndMediaUrl = async ({
  size,
  mimeType,
  meetingId,
}: {
  size: number;
  mimeType: string;
  meetingId: string;
}) => {
  const result = await apolloClient.mutate({
    mutation: StartUploadDocument,
    variables: {
      meetingId,
      mimeType,
      size,
      client: Config.NAME,
    },
  });

  if (result.errors?.length) {
    throw new Error(result.errors[0].message);
  }

  const upload = result.data?.startUpload;
  if (!upload) {
    throw new Error("Failed to start upload");
  }

  return {
    uploadUrl: upload.uploadUrl,
    mediaUrl: upload.mediaUrl,
  };
};

export interface UploadCompletePayload {
  mediaUrl: string;
  title: string;
  fileSize: number;
  mimeType: string;
  meetingId: string;
  audioSamplingRate?: number;
}

export const createUserFile = async ({
  mediaUrl,
  title,
  fileSize,
  mimeType,
  meetingId,
}: UploadCompletePayload) => {
  let fileName = title;
  // dashboard-ff relies on the file name to determine the extension
  // so we need to ensure the file name has an extension
  const extensionFromTitle = title.split(".").pop();
  const actualExtension = getExtensionFromMimeType(mimeType);
  if (!extensionFromTitle || actualExtension !== extensionFromTitle) {
    fileName = `${title}.${actualExtension}`;
  }

  const res = await apolloClient.mutate({
    mutation: CreateUserFileDocument,
    variables: {
      audioUrl: mediaUrl,
      fileName,
      fileSize,
      fileType: mimeType,
      meetingId,
    },
  });
  if (res.errors?.length) {
    const message = res.errors[0].message;
    if (message.includes("Duplicate")) {
      // ignore
      return;
    }
    throw new Error(message);
  }
};

export const completeUpload = async ({
  mimeType,
  meetingId,
  audioSamplingRate,
  duration,
}: {
  mimeType: string;
  meetingId: string;
  audioSamplingRate?: number;
  duration?: number;
}) => {
  const result = await apolloClient.mutate({
    mutation: CompleteUploadDocument,
    variables: {
      meetingId,
      mimeType,
      client: Config.NAME,
      platform: getActualPlatform(),
      audioSamplingRate: audioSamplingRate ?? 16000,
      duration,
    },
  });

  if (result.errors?.length) {
    throw new Error(result.errors[0].message);
  }

  if (!result.data?.completeUpload) {
    throw new Error("Failed to complete upload");
  }
};
