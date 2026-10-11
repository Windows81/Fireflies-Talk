import { useAuth } from "@/features/auth";
import type { Soundbite } from "@firefliesai/bites-ff.graphql-client";

export const useCanManageBite = (bite: Soundbite) => {
  const { user } = useAuth();
  return user?.id === bite.userId;
};
