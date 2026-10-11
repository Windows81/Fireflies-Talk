import { CAPTION_CATEGORY, MEETING_NOTE_CATEGORY_NAME_KEY } from "@/constants";
import type { Caption } from "@/features/transcript";
import type {
  Meeting,
  MeetingCaption,
} from "@firefliesai/mobile-ff.graphql-client";

/**
 * TODO: PERFORMANCE: Need to run on different thread
 * Correct caption speaker, text using speakerMeta, labelMeta, etc.
 * and normalize nlp metrics to our caption format
 */
export const processCaptionsForFilter = (
  captions: MeetingCaption[],
  callback: (captions: Caption[]) => void,
) => {
  const ignoreTaskmatch = ["do you", "none", "fireflies", "an"];
  const captionsWithFilter = captions.map((caption) => {
    let filters: Caption["filters"];
    if (caption.metrics?.length) {
      filters = filters || [];
      // map meeting note category to our category dict
      filters = caption.metrics
        .map((metric) => {
          const category =
            MEETING_NOTE_CATEGORY_NAME_KEY[
              metric.category as keyof typeof MEETING_NOTE_CATEGORY_NAME_KEY
            ];

          if (!category || !metric.word) {
            return null;
          }

          return {
            word: metric.word,
            category,
          };
        })
        .filter(Boolean) as {
        word: string;
        category: string;
      }[];
    }
    if (
      caption.match &&
      !ignoreTaskmatch.includes(caption.match) &&
      (caption.filterType === "taskNoteFilter" ||
        caption.filterType === "taskOutgoingFilter")
    ) {
      filters = filters || [];
      // caption.match is a string that is meant to be a regex
      const exp = new RegExp(
        caption.match
          .replace(/(\$|\?)/g, "\\$1")
          .replace(/></g, ".*")
          .replace(/(\w)(s|ll|re|m)\b/gi, `$1('|")?$2`)
          .replace(/\s/g, "\\W*"),
        "gi",
      );
      const matches = exp.exec(caption.sentence);
      if (matches) {
        for (const match of matches) {
          if (match) {
            filters.push({
              word: match,
              category: CAPTION_CATEGORY.Task,
            });
          }
        }
      }
    }
    if (caption.questionFilter) {
      filters = filters || [];
      filters.push({
        word: caption.sentence,
        category: CAPTION_CATEGORY.Questions,
      });
    }

    return {
      index: caption.index as number,
      text: caption.sentence,
      startTime: caption.time as number,
      endTime: caption.endTime as number,
      speakerName: caption.speaker_name as string,
      speakerId: String(caption.speaker_id),
      sentiment: caption.sentimentType as "positive" | "negative" | "neutral",
      filters,
    };
  });

  callback(captionsWithFilter);
};

export const formatMeetingCaptions = (
  caption: MeetingCaption[],
  {
    speakerMeta,
    labelMeta,
    sentenceMeta,
  }: Pick<Meeting, "speakerMeta" | "labelMeta" | "sentenceMeta">,
): MeetingCaption[] => {
  return caption.map((caption) => {
    let speaker_id = caption.speaker_id;
    if (labelMeta) {
      for (const [metaSpeakerId, captionIndexes] of Object.entries(labelMeta)) {
        if ((captionIndexes as number[])?.includes(caption.index)) {
          speaker_id = Number(metaSpeakerId);
          break;
        }
      }
    }

    let sentence = caption.sentence;
    if (sentenceMeta?.[caption.index]) {
      sentence = sentenceMeta[caption.index];
    }

    const speaker_name = speakerMeta?.[speaker_id + 1] || caption.speaker_name;

    return {
      ...caption,
      speaker_id,
      sentence,
      speaker_name,
    };
  });
};
