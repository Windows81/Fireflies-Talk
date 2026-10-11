import type { AuthUser } from "@/features/auth";
import type { Tier } from "@firefliesai/payments-ff.utils";
import { getTier } from "@firefliesai/payments-ff.utils";

export function getUserTier(user: Pick<AuthUser, "paidUser">): Tier {
  return getTier(user.paidUser);
}

export function getNameParts(name: string) {
  const parts = name.split(" ");
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}
