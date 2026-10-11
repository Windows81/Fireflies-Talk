import { IconFred } from "@/assets/svg";
import { Text } from "@/components/Typography";
import {
  AskFredChatModal,
  AskFredThreadProvider,
  LIVE_ASSIST_SUBMIT_PARAMS,
} from "@/features/ask-fred";
import { useRecorder } from "@/features/live-record";
import { createStyles, useTheme, vars } from "@/styles";
import { useBooleanState } from "@/utils/states";
import { useQuery } from "@apollo/client";
import { GetMeetingDocument } from "@firefliesai/mobile-ff.graphql-client";
import type { FC } from "react";
import { Pressable } from "react-native";
import type { RecordViewSource } from "../types";

/**
 * "Ask me anything" bar under the controls; opens the AskFred bottom sheet.
 * Live bot meetings keep the realtime Live Assist agent thread (same one the
 * live panel uses); device recordings use the regular AskFred agent.
 */
export const RecordAskFredBar: FC<{ source: RecordViewSource }> = ({
  source,
}) => {
  const theme = useTheme();
  const [isOpen, open, close] = useBooleanState();

  const liveMeeting =
    source.kind === "live-meeting" ? source.meeting : undefined;
  const recorderMeetingId = useRecorder((s) => s.context?.meetingId);

  const { data } = useQuery(GetMeetingDocument, {
    variables: { id: recorderMeetingId as string },
    skip: !!liveMeeting || !recorderMeetingId,
  });
  const meeting = liveMeeting ?? data?.meeting;

  return (
    <>
      <Pressable
        style={styles.bar(theme)}
        onPress={open}
        disabled={!meeting}
        aria-label="Ask Fred anything"
        role="button"
      >
        <IconFred width={24} height={24} />
        <Text variant="body2Regular" color="textMuted">
          Ask me anything
        </Text>
      </Pressable>
      {meeting && (
        // Same AskFred sheet + provider the meeting detail (Notepad) screen uses.
        <AskFredThreadProvider meetingId={meeting.id}>
          <AskFredChatModal
            meeting={meeting}
            isOpen={isOpen}
            close={close}
            submitParams={liveMeeting ? LIVE_ASSIST_SUBMIT_PARAMS : undefined}
          />
        </AskFredThreadProvider>
      )}
    </>
  );
};

const styles = createStyles({
  bar: (theme) => ({
    ...vars.elevations[1],
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderStaticSubtle,
    backgroundColor: theme.colors.layerDefault,
  }),
});
