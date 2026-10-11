import { IconPlus } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { FabButton } from "@/components/FabButton";
import { toast } from "@/components/Toast";
import type { TranscriptMarks } from "@/components/Transcript";
import { Transcript } from "@/components/Transcript";
import { Text } from "@/components/Typography";
import { openLoginPopup, useAuth } from "@/features/auth";
import { usePlayer } from "@/features/player";
import { useRemoteConstants } from "@/features/remote-constants";
import type { Caption } from "@/features/transcript";
import { createStyles, useTheme } from "@/styles";
import { toHHMMSS, toSecFromHHMMSS } from "@/utils/time";
import type { Soundbite } from "@firefliesai/bites-ff.graphql-client";
import {
  GetSoundbitesDocument,
  useCreateSoundbiteMutation,
} from "@firefliesai/bites-ff.graphql-client";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import { RangeSlider } from "@sharcoux/slider";
import { useEffect, useState, type FC } from "react";
import { InteractionManager, View } from "react-native";
import { MaskedTextInput } from "react-native-mask-text";

const TimeInput: FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  includeHours?: boolean;
  min: number;
  max: number;
}> = ({ label, value, onChange, includeHours, min, max }) => {
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    setIsValid(true);
  }, [value]);

  const theme = useTheme();

  const [localValue, setLocalValue] = useState<string>(
    toHHMMSS(value, includeHours),
  );

  useEffect(() => {
    setLocalValue(toHHMMSS(value, includeHours));
  }, [value, includeHours]);

  return (
    <View style={styles.timeInputContainer}>
      <Text color="textMuted">{label}</Text>
      <MaskedTextInput
        style={[
          styles.timeInput(theme),
          !isValid && styles.timeInputInvalid(theme),
        ]}
        value={localValue}
        onChangeText={(text) => {
          setLocalValue(text);

          // check if formatted conforms to either hh:mm:ss or mm:ss
          const isValidFormatted = text.match(
            includeHours
              ? /^([0-9]{2}:)?[0-9]{2}:[0-9]{2}$/
              : /^[0-9]{2}:[0-9]{2}$/,
          );

          const isValid = !!isValidFormatted;

          if (!isValid) {
            setIsValid(false);
            return;
          }

          const num = toSecFromHHMMSS(text);

          if (num < min || num > max) {
            setIsValid(false);
            return;
          }

          onChange(num);
        }}
        mask={includeHours ? "99:99:99" : "99:99"}
      />
    </View>
  );
};

export const NotepadCreateSoundbite: FC<{
  meeting: Meeting;
  close: () => void;
  setCreatedBite: (bite: Soundbite | null) => void;
  captions: Caption[] | undefined;
}> = ({ meeting, close, setCreatedBite, captions }) => {
  const { user } = useAuth();
  const { player } = usePlayer();

  // FIXME: duration_actual might actually be incorrect
  const durationMins = meeting.duration_actual || meeting.duration;
  const meetingDuration =
    typeof durationMins === "number"
      ? Math.floor(durationMins * 60)
      : Math.floor(player?.duration || 0);

  const [range, setRange] = useState<[number, number]>([0, meetingDuration]);

  const theme = useTheme();

  const [createSoundbite, { loading }] = useCreateSoundbiteMutation({
    refetchQueries: [GetSoundbitesDocument],
    onError(err) {
      toast({
        title: "Could not create soundbite",
        type: "error",
        message: err.message,
      });
    },
    onCompleted(data) {
      close();
      setCreatedBite(data.createSoundbite);
      toast({
        type: "success",
        message: "Soundbite created",
      });
    },
  });

  const [marks, setMarks] = useState<TranscriptMarks | undefined>(undefined);
  const { DEMO_MEETING_ID } = useRemoteConstants();

  useEffect(() => {
    const im = InteractionManager.runAfterInteractions(() => {
      if (!captions) return;
      const selectedCaptions = captions.filter(
        (c) => c.startTime >= range[0] && c.endTime <= range[1],
      );
      setMarks(
        selectedCaptions.reduce((acc, c) => {
          acc[c.index] = [{ word: c.text }];
          return acc;
        }, {} as TranscriptMarks),
      );
    });
    return () => im.cancel();
  }, [range, captions]);

  const onSubmit = () => {
    if (loading) return;

    if (!user) {
      openLoginPopup("notepad/create-soundbite");
      return;
    }

    if (meeting.id === DEMO_MEETING_ID) {
      toast("This action is not allowed on the sample meeting");
      return;
    }

    const [startTimeRaw, endTimeRaw] = range;
    const startTime = Math.floor(startTimeRaw);
    const endTime = Math.floor(endTimeRaw);

    // validate startTime and endTime
    if (startTime >= endTime) {
      toast({
        type: "error",
        message: "Start time must be before end time",
      });
      return;
    }

    if (startTime < 0 || endTime > meetingDuration) {
      toast({
        type: "error",
        message: "Start time and end time must be within the meeting duration",
      });
      return;
    }

    const duration = endTime - startTime;
    if (duration < 5) {
      toast({
        type: "error",
        message: "Soundbite must be at least 5 seconds long",
      });
      return;
    }

    createSoundbite({
      variables: {
        meetingId: meeting.id,
        startTime,
        endTime,
        mediaType: meeting.video_url ? "video" : "audio",
      },
    });
  };

  const includeHours = meetingDuration >= 60 * 60;

  return (
    <View style={styles.root}>
      <View style={styles.top(theme)}>
        {captions && <Transcript captions={captions} marks={marks} />}
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <TimeInput
            value={range[0]}
            min={0}
            max={range[1]}
            onChange={(value) => setRange([value, range[1]])}
            label="START"
            includeHours={includeHours}
          />
          <TimeInput
            min={range[0]}
            max={meetingDuration}
            value={range[1]}
            onChange={(value) => setRange([range[0], value])}
            label="END"
            includeHours={includeHours}
          />
        </View>
        <RangeSlider
          style={styles.slider}
          range={range}
          onSlidingComplete={(r) =>
            setRange([Math.floor(r[0]), Math.floor(r[1])])
          }
          step={1}
          minimumValue={0}
          maximumValue={meetingDuration}
          thumbTintColor={theme.colors.commandPrimaryDefault}
          inboundColor={theme.colors.commandPrimaryDefault}
          outboundColor={theme.colors.borderStaticDefault}
        />
        <Button onPress={onSubmit} disabled={loading}>
          Create Soundbite
        </Button>
      </View>
    </View>
  );
};

export const NotepadCreateSoundbiteDialog: FC<{
  isOpen: boolean;
  close: () => void;
  meeting: Meeting;
  captions: Caption[] | undefined;
  setCreatedBite: (bite: Soundbite | null) => void;
}> = ({ isOpen, close, meeting, setCreatedBite, captions }) => {
  return (
    <Dialog.Root isOpen={isOpen} close={close}>
      <Dialog.Header>Create soundbite</Dialog.Header>
      <NotepadCreateSoundbite
        meeting={meeting}
        setCreatedBite={setCreatedBite}
        close={close}
        captions={captions}
      />
    </Dialog.Root>
  );
};

export const AddSoundbiteButton: FC<{
  onPress: () => void;
}> = ({ onPress }) => {
  return (
    <FabButton
      onPress={onPress}
      aria-label="Create Soundbite"
      Icon={IconPlus}
    />
  );
};

const styles = createStyles({
  root: {
    flex: 1,
  },
  top: (theme) => ({
    flex: 1,
    backgroundColor: theme.colors.layerMuted,
    padding: 8,
  }),
  content: {
    padding: 20,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeInput: (theme) => ({
    minWidth: 70,
    minHeight: 27,
    padding: 4,
    borderColor: theme.colors.borderStaticDefault,
    borderWidth: 1,
    borderRadius: 4,
    textAlign: "center",
  }),
  timeInputInvalid: (theme) => ({
    borderColor: theme.colors.informationStaticRedSolid,
  }),
  slider: {
    marginBottom: 12,
  },
});
