import type { PhoneNumber } from "@firefliesai/mobile-ff.graphql-client";
import { type Dispatch, type SetStateAction } from "react";
import { create } from "zustand";
import type { PhoneCallContext, PhoneCallStates } from "./types";

/* import { Logger } from "@/logger";
import * as PhoneCall from "@/modules/phone-call";
import { PhoneCallErrorCode } from "@/modules/phone-call";
import { toast } from "@/components/Toast";
import {
  captureException,
  getErrorMessage,
  setSentryContext,
  setSentryTag,
} from "@/errors";
import { apolloClient } from "@/graphql";
import type { MeetingNotesPrivacy } from "@firefliesai/mobile-ff.graphql-client";
import { createDirectoryIfNotExist } from "@/utils/file";
import { isDefined } from "@/utils/object";
import { MakePhoneCallDocument } from "@firefliesai/mobile-ff.graphql-client";
import { CodedError } from "expo-modules-core";
import { Platform } from "react-native";
import InCallManager from "react-native-incall-manager";
import { localRecordStoreApi, RECORDING_DIRECTORY } from "../live-record";
import { AudioInputUnavailableError } from "./errors";
import { requestMicrophonePermissionOrFail } from "./utils";
import { useAuth } from "../auth";
import { format } from "date-fns";
import { useMeetingPrivacyOptions } from "../meeting";
import { RootNavigation } from "@/screens/RootNavigation";
import { RouteNames } from "@/constants"; */

interface PhoneCallStoreValue {
  status: PhoneCallStates;
  context: PhoneCallContext | null;

  uploadIntent: PhoneCallContext | null;
  setUploadIntent: Dispatch<SetStateAction<PhoneCallContext | null>>;

  setContext: (context: PhoneCallContext | null) => void;

  startCall(
    myNumberDetail: PhoneNumber,
    toNumber: string,
    contactName?: string,
    contactThumbnailPath?: string,
  ): Promise<void>;
  endCall(): Promise<void>;
  switchHold(): Promise<boolean>;
  switchMute(): Promise<boolean>;
  switchSpeaker(): Promise<boolean>;
}

//const logger = new Logger("phone-call");

export const usePhoneCall = create<PhoneCallStoreValue>((set) => {
  return {
    status: {
      state: "inactive",
      durationMillis: 0,
      micMuted: false,
      audioFromSpeaker: false,
    }, //PhoneCall.getStatus(),
    context: null,
    uploadIntent: null,

    setContext(context) {
      set({ context });
    },

    setUploadIntent(context) {
      set({ uploadIntent: context as PhoneCallContext });
    },

    /*     async startCall(
      myNumberDetail,
      toNumber,
      contactName,
      contactThumbnailPath,
    ) { */
    async startCall() {
      /* set({ context: null });
      const userPrivacy = useAuth.getState().user?.privacy;

      await requestMicrophonePermissionOrFail();

      // create directory if it doesn't exist
      if (Platform.OS !== "web") {
        await createDirectoryIfNotExist(RECORDING_DIRECTORY);
      }

      const id = Date.now().toString();

      const fileUri = `${RECORDING_DIRECTORY}${id}.m4a`;
      try {
        const makePhoneCallResponse = await apolloClient.mutate({
          mutation: MakePhoneCallDocument,
          variables: {
            phoneNumberId: myNumberDetail.id,
            toNumber: toNumber,
          },
        });

        if (
          makePhoneCallResponse.errors &&
          makePhoneCallResponse.errors.length > 0
        ) {
          throw new Error(
            makePhoneCallResponse.errors.map((err) => err.message).join(", "),
          );
        }

        const accessToken =
          makePhoneCallResponse.data?.makePhoneCall.accessToken;
        if (!accessToken) {
          throw new Error("Failed to get access token");
        }

        RootNavigation.navigate(RouteNames.PhoneCall);
        InCallManager.start({ media: "audio", auto: true });
        set({ status: { ...PhoneCall.getStatus(), state: "connecting" } });

        const response = await PhoneCall.startCall({
          from: myNumberDetail.number,
          to: toNumber,
          calleeName: contactName ?? toNumber,
          fileUri,
          accessToken,
          notificationAndroid: {
            channelId: "ff_call_recording",
            channelName: "Call Recording",
            notificationId: 100,
            contentTitle: "Fireflies",
            contentText: "A call recording is in progress.",
          },
        });

        const context = {
          title: `${contactName ?? toNumber}, ${format(new Date(), "MMM dd, hh:mm:ss aa")}`,
          to: toNumber,
          contactName: contactName ?? toNumber,
          contactThumbnailPath,
          notesPrivacy:
            (userPrivacy as MeetingNotesPrivacy) ||
            "link" as MeetingNotesPrivacy,
          fileUri: fileUri,
          callUUID: response.callUUID,
          startTime: Date.now(),
          endTime: undefined,
          durationMillis: undefined,
          askForUpload: false,
        };

        localRecordStoreApi.add({
          ...context,
          fileUris: [fileUri].filter(isDefined),
          uploaded: false,
          streamed: false,
        });

        set({ context });

        logger.info("phone-call: start", context);
      } catch (err) {
        InCallManager.stop();
        captureException(
          new Error(getErrorMessage(err, "call_recorder: start")),
          {
            contexts: {
              status: { ...get().status },
              context: { ...get().context },
            },
            tags: {
              section: "record-store",
            },
            fingerprint: [`{{ default }}`, String(err.code || err.message)],
          },
        );

        set({ status: { ...PhoneCall.getStatus(), state: "inactive" } });
        if (
          err instanceof CodedError &&
          err.code === PhoneCallErrorCode.ErrAudioInputUnavailable
        ) {
          throw new AudioInputUnavailableError();
        } else {
          throw err;
        }
      } */
    },
    async endCall() {
      /*       logger.info("call_recorder: stop");

      try {
        await PhoneCall.endCall();
        InCallManager.stop();
      } catch (err) {
        captureException(
          new Error(getErrorMessage(err, "call_recorder: end")),
          {
            tags: {
              section: "call-store",
            },
            fingerprint: [`{{ default }}`, String(err.code || err.message)],
          },
        );

        // reset states if error
        set({ status: PhoneCall.getStatus() });

        throw err;
      } */
    },
    async switchHold() {
      /* logger.info("call_recorder: switch hold");

      try {
        return await PhoneCall.holdCall();
      } catch (err) {
        captureException(
          new Error(getErrorMessage(err, "call_recorder: switch hold")),
          {
            tags: {
              section: "call-store",
            },
            fingerprint: [`{{ default }}`, String(err.code || err.message)],
          },
        );

        // reset states if error
        set({ status: PhoneCall.getStatus() });

        throw err;
      } */

      return false;
    },
    async switchMute() {
      /* logger.info("call_recorder: switch mute");

      try {
        return await PhoneCall.switchMute();
      } catch (err) {
        captureException(
          new Error(getErrorMessage(err, "call_recorder: switch mute")),
          {
            tags: {
              section: "call-store",
            },
            fingerprint: [`{{ default }}`, String(err.code || err.message)],
          },
        );

        set({ status: PhoneCall.getStatus() });
        if (
          err instanceof CodedError &&
          err.code === PhoneCallErrorCode.ErrAudioInputUnavailable
        ) {
          throw new AudioInputUnavailableError();
        } else {
          throw err;
        }
      } */

      return false;
    },
    async switchSpeaker() {
      /* logger.info("call_recorder: switch speaker");

      try {
        return await PhoneCall.switchAudioOutput();
      } catch (err) {
        captureException(
          new Error(getErrorMessage(err, "call_recorder: switch speaker")),
          {
            tags: {
              section: "call-store",
            },
            fingerprint: [`{{ default }}`, String(err.code || err.message)],
          },
        );

        set({ status: PhoneCall.getStatus() });
        throw err;
      } */

      return false;
    },
  };
});

export const phoneCallApi = usePhoneCall.getState() as Pick<
  PhoneCallStoreValue,
  | "startCall"
  | "endCall"
  | "switchHold"
  | "switchMute"
  | "switchSpeaker"
  | "setContext"
  | "setUploadIntent"
>;

/* PhoneCall.addEventListener("callStatus", (status) => {
  usePhoneCall.setState({ status });
});
PhoneCall.addEventListener("callError", (err) => {
  toast({
    title: err.code,
    message: err.message,
    type: "error",
  });

  captureException(
    new Error(`call_recorder: error: ${err.message} (${err.code})`),
    {
      tags: {
        section: "call-store",
      },
      contexts: {
        error: {
          ...err,
        },
        status: { ...usePhoneCall.getState().status },
        context: { ...usePhoneCall.getState().context },
      },
      extra: {
        stack: err.stack,
      },
      fingerprint: [`{{ default }}`, String(err.code || err.message)],
    },
  );
});
PhoneCall.addEventListener("callLog", (event) => {
  logger.info(`[PhoneCallModule] ${event.message}`);
});
PhoneCall.addEventListener("callInterrupt", (event) => {
  logger.info(`recorder: interrupt: ${event.reason}`);
});
PhoneCall.addEventListener("callEnd", (status) => {
  usePhoneCall.setState({ status });
  if (usePhoneCall.getState().context) {
    const context = {
      ...usePhoneCall.getState().context,
      endTime: Date.now(),
      durationMillis: status.durationMillis,
    } as PhoneCallContext;
    phoneCallApi.setContext(context);
    localRecordStoreApi.updateByUri(context.fileUri, context);
    phoneCallApi.setUploadIntent(context);
  }
  InCallManager.stop();
});

let recordingTrackTimer: ReturnType<typeof setInterval> | undefined;
usePhoneCall.subscribe((state, prevState) => {
  if (state.status.state !== prevState.status.state) {
    clearInterval(recordingTrackTimer);
    if (state.status.state !== "inactive") {
      setSentryContext("call_recorder", {
        status: state.status,
        context: state.context,
      });
      setSentryTag("is_call_recording", "true");

      if (state.status.state === "ongoing") {
        recordingTrackTimer = setInterval(
          () => {
            const latestState = usePhoneCall.getState();
            setSentryContext("call_recorder", {
              status: latestState.status,
              context: latestState.context,
            });
          },
          // track every 2 minutes
          2 * 60 * 1000,
        );
      }
    } else {
      setSentryContext("call_recorder", null);

      setSentryTag("is_call_recording", undefined);
    }
  }
});
 */
