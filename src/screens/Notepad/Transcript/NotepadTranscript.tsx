import type { GroupedCaption, TranscriptMarks } from "@/components/Transcript";
import {
  LoadingTranscript,
  Transcript,
  computeTextSearchFilter,
} from "@/components/Transcript";
import { usePlayer } from "@/features/player";
import { type Caption } from "@/features/transcript";
import { isDefined } from "@/utils/object";
import { useBooleanState } from "@/utils/states";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { InteractionManager, StyleSheet, View } from "react-native";
import { useMeetingCapabilities } from "src/features/meeting/utils/permissions";
import { useMeetingCapabilityGates } from "src/features/meeting/access/useMeetingCapabilityGates";
import type { SmartSearchFilterState } from "../SmartSearch";
import { computeSmartSearchFilter } from "../SmartSearch";
import { EditSpeakerDialog } from "./EditSpeakerDialog";

export const NotepadTranscript: FC<{
  meeting: Meeting;
  smartSearchFilter?: SmartSearchFilterState;
  search: string | undefined;
  captions: Caption[];
  mediaDisabled?: boolean;
}> = ({ meeting, smartSearchFilter, search, captions, mediaDisabled }) => {
  const { player } = usePlayer();

  const onCaptionClick = useCallback(
    (caption: Caption) => {
      player.currentTime = caption.startTime;
      player.play();
    },
    [player],
  );

  const [filter, setFilter] = useState<{
    includedIndexes: number[] | undefined;
    marks: TranscriptMarks | undefined;
  }>({
    includedIndexes: undefined,
    marks: undefined,
  });
  useEffect(() => {
    if (!captions) return;
    const hasSmartSearchFilter =
      !!smartSearchFilter &&
      Object.values(smartSearchFilter).filter(isDefined).length > 0;
    if (!hasSmartSearchFilter && typeof search !== "string") {
      setFilter({
        includedIndexes: undefined,
        marks: undefined,
      });
      return;
    }
    // resolve smart search matches
    const { cancel } = InteractionManager.runAfterInteractions(() => {
      if (hasSmartSearchFilter) {
        setFilter(computeSmartSearchFilter(captions, smartSearchFilter));
        return;
      } else if (typeof search === "string") {
        if (search) setFilter(computeTextSearchFilter(captions, search));
        else {
          setFilter({
            includedIndexes: undefined,
            marks: undefined,
          });
        }
        return;
      }
    });
    return cancel;
  }, [captions, search, smartSearchFilter]);

  const editSpeakerGroupedCaption = useRef<GroupedCaption | undefined>(
    undefined,
  );
  const [isOpenEditSpeaker, openEditSpeaker, closeEditSpeaker] =
    useBooleanState();

  const onCaptionSpeakerClick = useCallback(
    (groupedCaption: GroupedCaption) => {
      editSpeakerGroupedCaption.current = groupedCaption;
      openEditSpeaker();
    },
    [openEditSpeaker],
  );

  const { canEditMetadata } = useMeetingCapabilities(meeting);
  const { editDenied } = useMeetingCapabilityGates(meeting.id, {
    editTranscript: true,
  });
  const canEditSpeaker = canEditMetadata && !editDenied;

  return (
    <>
      <View style={styles.root}>
        <Transcript
          captions={captions || []}
          onCaptionClick={mediaDisabled ? undefined : onCaptionClick}
          onCaptionSpeakerClick={
            canEditSpeaker ? onCaptionSpeakerClick : undefined
          }
          marks={filter.marks}
          includedIndexes={filter.includedIndexes}
          player={mediaDisabled ? undefined : player || undefined}
        />
      </View>
      <EditSpeakerDialog
        meeting={meeting}
        close={closeEditSpeaker}
        isOpen={isOpenEditSpeaker}
        groupedCaption={editSpeakerGroupedCaption.current}
      />
    </>
  );
};

export const LoadingNotepadTranscript: FC = () => {
  return (
    <View style={styles.root}>
      <LoadingTranscript />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
