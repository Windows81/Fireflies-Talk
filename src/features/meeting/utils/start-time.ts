// Generic + structural so this works with both the local (@/graphql) and
// package (@firefliesai/mobile-ff.graphql-client) Meeting types without
// importing either — their DateTime scalar is typed `any` in both codegens,
// and preserving that (rather than narrowing to string | number) keeps
// callers that expect a Date-compatible value assignable.
//
// fredJoinedMeetingAt (when the bot actually joined) is preferred over the
// scheduled startTime, which can drift from when recording actually began.
export const getMeetingStartedAt = <T>(
  meeting:
    | { fredJoinedMeetingAt?: T | null; startTime?: T | null }
    | null
    | undefined,
): T | null | undefined => meeting?.fredJoinedMeetingAt ?? meeting?.startTime;
