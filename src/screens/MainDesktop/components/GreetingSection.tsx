import { Text } from "@/components/Typography";
import {
  getLocalUserFlag,
  setLocalUserFlag,
  DESKTOP_GREETING_INTRO_DISMISSED_FLAG_KEY,
} from "@/features/user-flags";
import { getGreeting } from "@/utils/greeting";
import { GreetingIntroView } from "./GreetingIntroView";
import { useCallback, useState } from "react";
import type { FC } from "react";
import type { User } from "@/graphql";

interface GreetingSectionProps {
  user: User;
  /** When provided, used instead of computing from user.createdAt (e.g. from useMeetingStateAfterSignup) */
  isNewUser?: boolean;
}

export const GreetingSection: FC<GreetingSectionProps> = ({
  user,
  isNewUser: isNewUserProp,
}) => {
  const greeting = getGreeting();
  const { profile, createdAt } = user || {};
  const { firstName, name } = profile || {};
  const userName = firstName || name || "";

  const isNewUser =
    isNewUserProp ??
    (createdAt
      ? new Date(createdAt) > new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)
      : false);
  const [showIntro, setShowIntro] = useState(
    () => !getLocalUserFlag(DESKTOP_GREETING_INTRO_DISMISSED_FLAG_KEY),
  );
  const handleCloseIntro = useCallback(() => {
    setLocalUserFlag(DESKTOP_GREETING_INTRO_DISMISSED_FLAG_KEY, true);
    setShowIntro(false);
  }, []);

  if (showIntro && isNewUser) {
    return <GreetingIntroView userName={userName} onClose={handleCloseIntro} />;
  }

  return (
    <Text
      variant="title1Weight"
      color="textPrimary"
    >{`${greeting}, ${userName}`}</Text>
  );
};
