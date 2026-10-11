export enum ASK_FRED_PRIVACY {
  OWNER = "owner",
  FRED = "fred",
}
export enum ASK_FRED_SOURCE {
  SUGGESTED_PROMPTS = "suggested-prompts",
}

export const DEFAULT_LIVE_ASSIST_SUGGESTIONS = (
  userName: string,
): ReadonlyArray<{
  emoji: string;
  reasoning: string;
  suggestion: string;
}> => [
  {
    suggestion: `Suggest follow up questions [CONTEXT_START] Based strictly on the last 1–2 minutes of conversation, generate 1–3 short, natural, and contextually relevant follow-up questions that ${userName} could ask next.[CONTEXT_END]`,
    emoji: "💡",
    reasoning: "This is a default action that is always present",
  },
  {
    suggestion:
      "Catch me up (Last 1 min) [CONTEXT_START] Give a brief summary based only on the last 1-2 min of conversation in bullet points. Base the summary strictly on the provided conversation context. Do not infer or add new information.[CONTEXT_END]",
    emoji: "📝",
    reasoning: "This is a default action that is always present",
  },
];

export const DEFAULT_POST_MEETING_SUGGESTIONS: ReadonlyArray<{
  emoji: string;
  reasoning: string;
  suggestion: string;
}> = [
  {
    suggestion:
      "Write follow up email [CONTEXT_START] Draft a professional follow-up email summarizing the key points discussed in the meeting and any next steps or action items. [CONTEXT_END]",
    emoji: "📧",
    reasoning: "This is a default action for post-meeting view",
  },
  {
    suggestion:
      "List my todos [CONTEXT_START] Extract and list all action items, tasks, and todos mentioned in the meeting. For each item, include what needs to be done, who is responsible (if mentioned), and any deadlines or timeframes. [CONTEXT_END]",
    emoji: "☑️",
    reasoning: "This is a default action for post-meeting view",
  },
  {
    suggestion:
      "Share tldr [CONTEXT_START] Provide a concise TL;DR (too long; didn't read) summary of the meeting highlighting the most important points, decisions made, and key takeaways. [CONTEXT_END]",
    emoji: "📝",
    reasoning: "This is a default action for post-meeting view",
  },
];
