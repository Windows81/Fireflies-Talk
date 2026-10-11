import { Text } from "@/components/Typography";
import { useAuth } from "@/features/auth";
import { useGetCurrentUserQuery } from "@/graphql";
import { getGreeting } from "@/utils/greeting";
import type { FC } from "react";

export const HeaderGreeting: FC = () => {
  const authName = useAuth((s) => s.user?.name)?.split(" ")[0] ?? "";
  const { data } = useGetCurrentUserQuery();

  const greeting = getGreeting();
  const profile = data?.user?.profile;
  const displayName = profile?.firstName || profile?.name || authName;

  return (
    <Text variant="title2Weight" color="textPrimary" numberOfLines={1}>
      {greeting}, {displayName}
    </Text>
  );
};
