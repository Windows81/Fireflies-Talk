import type { Metadata } from "@/features/player";
import { usePlayer } from "@/features/player";
import type { Meeting } from "@firefliesai/mobile-ff.graphql-client";
import { useEffect } from "react";

export const useNotepadPlayer = (meeting: Meeting, initialTime?: number) => {
  const { setOptions } = usePlayer();

  useEffect(() => {
    const metadata: Metadata = {
      title: meeting.title || undefined,
      artist: meeting.organizer?.name || meeting.organizerEmail || undefined,
      artwork: meeting.organizer?.picture || undefined,
    };
    if (meeting.video_url) {
      setOptions({
        sources: [{ src: meeting.video_url, type: "video/mp4" }],
        metadata,
        initialTime: initialTime,
        mediaKey: meeting.id,
      });
    } else if (meeting.audio_url) {
      setOptions({
        sources: [{ src: meeting.audio_url, type: "audio/mp3" }],
        metadata,
        initialTime: initialTime,
        mediaKey: meeting.id,
      });
    }
  }, [
    meeting.id,
    meeting.video_url,
    meeting.audio_url,
    meeting.title,
    meeting.organizer?.name,
    meeting.organizerEmail,
    meeting.organizer?.picture,
    initialTime,
    setOptions,
  ]);
};
