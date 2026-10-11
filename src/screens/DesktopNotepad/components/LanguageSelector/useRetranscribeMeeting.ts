import { toast } from "@/components/Toast";
import { useGetLanguageNameByCode } from "@/features/language";
import { useTranscribeCustomLangMutation } from "@/graphql";
import { useSummaryProcessing } from "../../hooks/useSummaryProcessing";

export const useRetranscribeMeeting = (meetingId: string) => {
  const getLanguageNameByCode = useGetLanguageNameByCode();
  const { start: startPolling } = useSummaryProcessing(meetingId);

  const [mutate, { loading }] = useTranscribeCustomLangMutation({
    onError(error) {
      toast({
        type: "error",
        title: "Could not change meeting language",
        message: error.message,
      });
    },
  });

  const retranscribe = (customLanguage: string) => {
    mutate({ variables: { meetingId, customLanguage } })
      .then(({ data }) => {
        if (!data?.transcribeCustomLang) return;
        toast(
          `Transcribing meeting in '${getLanguageNameByCode(customLanguage)}'`,
        );
        startPolling();
      })
      .catch((error) => {
        toast({
          type: "error",
          title: "Could not change meeting language",
          message: error.message || "Please try again later",
        });
      });
  };

  return { retranscribe, loading };
};
