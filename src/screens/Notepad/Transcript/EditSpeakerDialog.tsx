import { IconCheck } from "@/assets/svg";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Dialog } from "@/components/Dialog";
import { TextInput } from "@/components/Input";
import { toast } from "@/components/Toast";
import type { GroupedCaption } from "@/components/Transcript";
import { Text } from "@/components/Typography";
import { useRemoteConstants } from "@/features/remote-constants";
import { useSaveNotesMutation } from "@/graphql";
import { createStyles, useTheme } from "@/styles";
import { isDefined } from "@/utils/object";
import { GetMeetingNoteAnalyticsDocument } from "@firefliesai/analytics-ff.graphql-client";
import { type Meeting } from "@firefliesai/mobile-ff.graphql-client";
import { useCallback, useEffect, useMemo, useState, type FC } from "react";
import { Keyboard, Pressable, ScrollView, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { formatMeetingCaptions } from "../utils/captions";

const getPossibleSpeakerNames = (meeting: Meeting) => {
  const speakerNames = Object.values(meeting.speakerMeta || {}) as string[];
  const attendeeNames =
    meeting.attendees
      ?.map((attendee) => attendee.displayName)
      ?.filter(isDefined) || [];

  return Array.from(new Set([...speakerNames, ...attendeeNames])).sort((a, b) =>
    a.localeCompare(b),
  );
};

const removeCaptionIndexesFromLabelMeta = (
  newLabelMeta: Record<string, number[]>,
  captionIndexes: number[],
) => {
  const newLabelMetaEntries = Object.entries(newLabelMeta);
  for (const [speakerId, indexes] of newLabelMetaEntries) {
    newLabelMeta[speakerId] = indexes.filter(
      (index) => !captionIndexes.includes(index),
    );
  }
  return newLabelMeta;
};

const getNextSpeakerId = (
  speakerMetaEntries: [speakerIdPlus1: string, speakerName: string][],
  meeting: Meeting,
) => {
  let existingSpeakerIds: number[];
  if (speakerMetaEntries?.length) {
    // spekaerMeta is 1-indexed
    existingSpeakerIds = speakerMetaEntries.map(([id]) => Number(id) - 1);
  } else {
    existingSpeakerIds = Array.from(
      new Set(meeting.captions?.map((caption) => caption.speaker_id) || []),
    );
  }
  return Math.max(...existingSpeakerIds) + 1;
};

const SpeakerNameOption: FC<{
  speakerName: string;
  groupedCaption: GroupedCaption;
  selectedSpeakerName: string;
  setSelectedSpeakerName: (name: string) => void;
  setCustomSpeakerName: (name: string) => void;
  isApplyAll: boolean;
  setIsApplyAll: (value: boolean) => void;
}> = ({
  speakerName,
  groupedCaption,
  selectedSpeakerName,
  setSelectedSpeakerName,
  setCustomSpeakerName,
  isApplyAll,
  setIsApplyAll,
}) => {
  const theme = useTheme();

  const isCurrent = speakerName === groupedCaption.speakerName;
  const isSelected = speakerName === selectedSpeakerName;
  const isNewlySelected = isSelected && !isCurrent;

  useEffect(() => {
    if (!isSelected) {
      setIsApplyAll(false);
    }
  }, [isSelected, setIsApplyAll]);

  return (
    <View
      style={[styles.nameItem, isSelected && styles.nameItemSelected(theme)]}
    >
      <Pressable
        style={styles.nameItemContent}
        onPress={() => {
          setSelectedSpeakerName(speakerName);
          setCustomSpeakerName("");
        }}
        role="option"
        aria-selected={isSelected}
      >
        <Text
          variant="label1Regular"
          style={styles.nameItemText}
          numberOfLines={1}
        >
          {speakerName}
        </Text>
        {isSelected && (
          <IconCheck
            color={
              isNewlySelected ? theme.colors.textBrand : theme.colors.textMuted
            }
            width={16}
            height={16}
          />
        )}
      </Pressable>
      {isNewlySelected && (
        <Animated.View entering={FadeIn.duration(200)}>
          <Checkbox
            label="Apply to all paragraphs from this speaker"
            value={isApplyAll}
            onValueChange={setIsApplyAll}
          />
        </Animated.View>
      )}
    </View>
  );
};

const SpeakerNameList: FC<{
  visible: boolean;
  meeting: Meeting;
  customSpeakerName: string;
  setCustomSpeakerName: (name: string) => void;
  groupedCaption: GroupedCaption;
  isApplyAll: boolean;
  setIsApplyAll: (value: boolean) => void;
  selectedSpeakerName: string;
  setSelectedSpeakerName: (name: string) => void;
}> = ({
  visible,
  meeting,
  customSpeakerName,
  setCustomSpeakerName,
  groupedCaption,
  isApplyAll,
  setIsApplyAll,
  selectedSpeakerName,
  setSelectedSpeakerName,
}) => {
  const suggestedSpeakerNames = useMemo(
    () =>
      getPossibleSpeakerNames(meeting).filter((name) =>
        name.toLowerCase().includes(customSpeakerName.trim().toLowerCase()),
      ),
    [meeting, customSpeakerName],
  );

  const animValue = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    animValue.value = withTiming(visible ? 1 : 0, { duration: 1000 });
  }, [visible, animValue]);

  // 48 for each item, but one of them may be in selected which include
  // the height of the checkbox
  const ITEM_HEIGHT = 32 + 8 * 2;
  const ITEM_HEIGHTS = (suggestedSpeakerNames.length - 1) * ITEM_HEIGHT + 76;

  const height = Math.min(ITEM_HEIGHTS, 224);

  const animStyle = useAnimatedStyle(
    () => ({
      opacity: animValue.value,
      height: animValue.value * height,
    }),
    [visible, height],
  );

  return (
    <Animated.View style={[styles.nameList, animStyle]}>
      <ScrollView>
        {suggestedSpeakerNames.map((name) => (
          <SpeakerNameOption
            key={name}
            groupedCaption={groupedCaption}
            selectedSpeakerName={selectedSpeakerName}
            setSelectedSpeakerName={setSelectedSpeakerName}
            setCustomSpeakerName={setCustomSpeakerName}
            speakerName={name}
            isApplyAll={isApplyAll}
            setIsApplyAll={setIsApplyAll}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const SpeakerNameInput: FC<{
  customSpeakerName: string;
  setCustomSpeakerName: (name: string) => void;
  customSpeakerNameFocused: boolean;
  setCustomSpeakerNameFocused: (value: boolean) => void;
  isApplyAll: boolean;
  setIsApplyAll: (value: boolean) => void;
}> = ({
  customSpeakerName,
  setCustomSpeakerName,
  customSpeakerNameFocused,
  setCustomSpeakerNameFocused,
  isApplyAll,
  setIsApplyAll,
}) => {
  // using scroll view allows us to cancel keyboard
  return (
    <View style={styles.customName}>
      <ScrollView contentContainerStyle={styles.customNameContainer}>
        <Text variant="label1Weight" color="textMuted">
          Speakers
        </Text>
        <TextInput
          placeholder="Enter speaker's name"
          value={customSpeakerName}
          onValueChange={setCustomSpeakerName}
          onFocus={() => setCustomSpeakerNameFocused(true)}
          onBlur={() => setCustomSpeakerNameFocused(false)}
          clearable
          onClear={() => {
            setCustomSpeakerName("");
            setCustomSpeakerNameFocused(false);
          }}
        />
      </ScrollView>
      {(customSpeakerNameFocused || customSpeakerName.trim().length > 0) && (
        <Animated.View entering={FadeIn.duration(200)}>
          <Checkbox
            label="Apply to all paragraphs from this speaker"
            value={isApplyAll}
            onValueChange={setIsApplyAll}
          />
        </Animated.View>
      )}
    </View>
  );
};

const EditSpeakerDialogContent: FC<{
  meeting: Meeting;
  groupedCaption: GroupedCaption;
  close: () => void;
}> = ({ meeting, groupedCaption, close }) => {
  const { DEMO_MEETING_ID } = useRemoteConstants();

  const [saveNotes] = useSaveNotesMutation({
    refetchQueries: [
      {
        query: GetMeetingNoteAnalyticsDocument,
        variables: {
          parseId: meeting.id,
          forceCompute: true,
        },
      },
    ],
    onError(err) {
      toast({
        title: "Could not update speaker label",
        message: err.message,
        type: "error",
      });
    },
    optimisticResponse(vars) {
      return {
        __typename: "Mutation",
        saveNotes: {
          labelMeta: vars.labelMeta || meeting.labelMeta,
          speakerMeta: vars.speakerMeta || meeting.speakerMeta,
          paragraphMeta: meeting.paragraphMeta,
          sentenceMeta: meeting.sentenceMeta,
          __typename: "MeetingNote",
        },
      };
    },
    update(cache, result) {
      const saveNotes = result.data?.saveNotes;
      if (!saveNotes) return;

      const fixedLabelMeta = saveNotes.labelMeta
        ? Object.entries(saveNotes.labelMeta).reduce(
            (prev, curr) => ({
              ...prev,
              [curr[0]]:
                typeof curr[1] === "string" ? curr[1].split(",") : curr[1],
            }),
            {},
          )
        : null;

      cache.modify<Meeting>({
        id: cache.identify(meeting),
        fields: {
          speakerMeta() {
            return saveNotes.speakerMeta;
          },
          labelMeta() {
            return fixedLabelMeta;
          },
          captions() {
            if (!meeting.captions) return [];
            // reformat captions to include updated
            return formatMeetingCaptions(meeting.captions, {
              labelMeta: fixedLabelMeta,
              speakerMeta: result.data?.saveNotes?.speakerMeta,
              sentenceMeta: meeting.sentenceMeta,
            });
          },
        },
        broadcast: true,
      });
    },
  });

  const saveSpeakerName = useCallback(
    (newSpeakerName: string, applyAll: boolean) => {
      if (meeting.id === DEMO_MEETING_ID) {
        toast("This action is not allowed on the sample meeting");
        return;
      }

      const captionsWithSpeakerId =
        meeting.captions?.filter(
          (caption) => caption.speaker_id === Number(groupedCaption.speakerId),
        ) || [];

      const originalSpeakerName = groupedCaption.speakerName;

      const newSpeakerMeta = {
        ...(meeting.speakerMeta || {}),
      };

      const newLabelMeta = {
        ...(meeting.labelMeta || {}),
      } as Record<string, number[]>;

      /**
       * SpeakerMeta, speakerLabel logic.
       * -  If applyAll, we will check if there is an existing speakerMeta entry
       *    with the same name as the newSpeakerName. If there is, we will simply override
       *    the speaker name for that particular speakerId in speakerMeta
       *    Otherwise, we will create a new speakerId and add it to speakerMeta
       *    and assign all captionsWithSpeakerId to that new speakerId via labelMeta
       */

      const speakerMetaEntries = Object.entries<string>(
        meeting.speakerMeta || {},
      );

      const existingSpeakerMetaEntry = speakerMetaEntries.find(
        ([, name]) => name === newSpeakerName,
      );
      const existingSpeakerMeta = existingSpeakerMetaEntry
        ? {
            // key of speakerMeta is 1-indexed
            speakerId: Number(existingSpeakerMetaEntry[0]) - 1,
            speakerName: existingSpeakerMetaEntry[1],
          }
        : null;

      if (applyAll) {
        // assigned speakerId for all captions with the same speakerId
        // not only the selected ones
        const selectedCaptionIndexes = captionsWithSpeakerId.map(
          (caption) => caption.index,
        );
        if (
          Number(groupedCaption.speakerId) === existingSpeakerMeta?.speakerId
        ) {
          // just override the speaker name for that particular
          newSpeakerMeta[Number(groupedCaption.speakerId) + 1] = newSpeakerName;
        } else {
          removeCaptionIndexesFromLabelMeta(
            newLabelMeta,
            selectedCaptionIndexes,
          );

          if (existingSpeakerMeta) {
            newLabelMeta[existingSpeakerMeta.speakerId] = [
              ...(newLabelMeta[existingSpeakerMeta.speakerId] || []),
              ...selectedCaptionIndexes,
            ];
          } else {
            const nextSpeakerId = getNextSpeakerId(speakerMetaEntries, meeting);

            newSpeakerMeta[nextSpeakerId + 1] = newSpeakerName;

            newLabelMeta[nextSpeakerId] = captionsWithSpeakerId.map(
              (caption) => caption.index,
            );
          }
        }
      } else {
        // just assigned speakerId for selected captions
        const selectedCaptionIndexes = groupedCaption.captions.map(
          (caption) => caption.index,
        );

        removeCaptionIndexesFromLabelMeta(newLabelMeta, selectedCaptionIndexes);

        if (existingSpeakerMeta) {
          newLabelMeta[existingSpeakerMeta.speakerId] = [
            ...(newLabelMeta[existingSpeakerMeta.speakerId] || []),
            ...selectedCaptionIndexes,
          ];
        } else {
          const nextSpeakerId = getNextSpeakerId(speakerMetaEntries, meeting);

          newSpeakerMeta[nextSpeakerId + 1] = newSpeakerName;
          newLabelMeta[nextSpeakerId] = selectedCaptionIndexes;
        }
      }

      // delete empty labelMeta
      Object.entries(newLabelMeta).forEach(([speakerId, indexes]) => {
        if (indexes.length === 0) {
          delete newLabelMeta[speakerId];
        }
      });

      saveNotes({
        variables: {
          meetingId: meeting.id,
          labelMeta: newLabelMeta,
          speakerMeta: newSpeakerMeta,
        },
      }).then((res) => {
        if (!res.errors) {
          toast({
            message: `Replaced '${originalSpeakerName}' with '${newSpeakerName}'`,
            type: "success",
          });
        }
      });

      close();
    },
    [meeting, DEMO_MEETING_ID, groupedCaption, saveNotes, close],
  );

  const [customSpeakerName, setCustomSpeakerName] = useState("");
  const [customSpeakerNameFocused, setCustomSpeakerNameFocused] =
    useState(false);

  const [isApplyAll, setIsApplyAll] = useState(false);

  const [selectedSpeakerName, setSelectedSpeakerName] = useState(
    groupedCaption.speakerName,
  );

  useEffect(() => {
    // reset all states when a different speaker paragraph is being edited
    setIsApplyAll(false);
    setCustomSpeakerName("");
    setSelectedSpeakerName(groupedCaption.speakerName);
  }, [groupedCaption.index, groupedCaption.speakerName]);

  const hasCustomSpeakerName = customSpeakerName.trim().length > 0;

  const canUpdate = useMemo(() => {
    if (hasCustomSpeakerName) {
      return true;
    }
    return selectedSpeakerName !== groupedCaption.speakerName;
  }, [hasCustomSpeakerName, selectedSpeakerName, groupedCaption]);

  const submitUpdate = useCallback(() => {
    if (hasCustomSpeakerName) {
      saveSpeakerName(customSpeakerName.trim(), isApplyAll);
      return;
    }
    saveSpeakerName(selectedSpeakerName, isApplyAll);
  }, [
    hasCustomSpeakerName,
    customSpeakerName,
    selectedSpeakerName,
    isApplyAll,
    saveSpeakerName,
  ]);

  return (
    <View style={styles.root}>
      <SpeakerNameInput
        customSpeakerName={customSpeakerName}
        setCustomSpeakerName={setCustomSpeakerName}
        customSpeakerNameFocused={customSpeakerNameFocused}
        setCustomSpeakerNameFocused={setCustomSpeakerNameFocused}
        isApplyAll={isApplyAll}
        setIsApplyAll={setIsApplyAll}
      />
      <SpeakerNameList
        meeting={meeting}
        customSpeakerName={customSpeakerName}
        setCustomSpeakerName={setCustomSpeakerName}
        groupedCaption={groupedCaption}
        isApplyAll={isApplyAll}
        setIsApplyAll={setIsApplyAll}
        selectedSpeakerName={selectedSpeakerName}
        setSelectedSpeakerName={setSelectedSpeakerName}
        visible={!customSpeakerNameFocused}
      />
      <View style={styles.updateContainer}>
        <Button disabled={!canUpdate} onPress={submitUpdate}>
          Update
        </Button>
      </View>
    </View>
  );
};

export const EditSpeakerDialog: FC<{
  meeting: Meeting;
  groupedCaption: GroupedCaption | undefined;
  isOpen: boolean;
  close: () => void;
}> = ({ meeting, groupedCaption, isOpen, close }) => {
  return (
    <Dialog.Root
      variant="bottomSheet"
      isOpen={isOpen}
      close={() => {
        if (Keyboard.isVisible?.()) {
          Keyboard.dismiss();
        } else {
          close();
        }
      }}
      aria-label="Update speaker label"
      style={styles.dialog}
    >
      {groupedCaption && (
        <EditSpeakerDialogContent
          meeting={meeting}
          groupedCaption={groupedCaption}
          close={close}
        />
      )}
    </Dialog.Root>
  );
};

const styles = createStyles({
  dialog: {
    borderTopStartRadius: 0,
    borderTopEndRadius: 0,
  },
  root: {},
  nameList: {
    gap: 8,
    overflow: "hidden",
  },
  nameItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 2,
  },
  nameItemContent: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 32,
  },
  nameItemSelected: (theme) => ({
    backgroundColor: theme.colors.layerSubtle,
  }),
  nameItemText: {
    flex: 1,
  },
  customName: {
    paddingHorizontal: 16,
    justifyContent: "flex-start",
    gap: 2,
  },
  customNameContainer: {
    gap: 12,
    paddingVertical: 10,
    width: "100%",
  },
  updateContainer: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
});
