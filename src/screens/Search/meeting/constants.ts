import {
  IconGlobe,
  IconHash,
  IconLock,
  IconShare,
  IconUser,
} from "@/assets/svg";
import { LOCAL_CHANNEL_NAMES } from "@/features/channel";
import type { Channel } from "@/graphql";
import type { FC } from "react";
import type { SvgProps } from "react-native-svg";

export const DEFAULT_SCOPE = "all";
export const MIN_QUERY_LENGTH = 3;

export interface PrivacyScope {
  id: string;
  label: string;
  Icon: FC<SvgProps>;
}

const PRIVACY_SCOPE_ICONS: Record<
  keyof typeof LOCAL_CHANNEL_NAMES,
  FC<SvgProps>
> = {
  all: IconGlobe,
  mine: IconUser,
  shared: IconShare,
};

// Ids and labels come from the shared channel constants so this list can't
// drift from the Notebook channel selector; only the icons are local.
export const PRIVACY_SCOPES: PrivacyScope[] = (
  Object.keys(LOCAL_CHANNEL_NAMES) as (keyof typeof LOCAL_CHANNEL_NAMES)[]
).map((id) => ({
  id,
  label: LOCAL_CHANNEL_NAMES[id],
  Icon: PRIVACY_SCOPE_ICONS[id],
}));

export const isPrivacyScope = (scope: string) =>
  PRIVACY_SCOPES.some((option) => option.id === scope);

export interface ScopeDescriptor {
  label: string;
  Icon?: FC<SvgProps>;
}

/**
 * Label + leading icon for the scope chip. Privacy scopes use their own icon;
 * real channels use a hash (public) or lock (private). The default "all" scope
 * has no descriptor so the chip falls back to the neutral "More" state.
 */
export const getScopeDescriptor = (
  scope: string,
  channels: Channel[],
): ScopeDescriptor => {
  if (scope === DEFAULT_SCOPE) return { label: "More" };

  const privacy = PRIVACY_SCOPES.find((option) => option.id === scope);
  if (privacy) return { label: privacy.label, Icon: privacy.Icon };

  const channel = channels.find((item) => item?._id === scope);
  return {
    label: channel?.title || "Channel",
    Icon: channel?.isPrivate ? IconLock : IconHash,
  };
};
