import { FredTyping } from "@/features/ask-fred/components/FredTyping";
import { useTheme } from "@/styles";
import type { FC } from "react";
import { resolveFredPartStatus, statusIconConfig } from "./statusIconConfig";

interface StatusIconProps {
  status: string | undefined;
  size?: number;
}

export const StatusIcon: FC<StatusIconProps> = ({ status, size = 16 }) => {
  const theme = useTheme();
  const { Icon, iconColor } = statusIconConfig[resolveFredPartStatus(status)];

  if (!Icon) return <FredTyping />;

  return <Icon width={size} height={size} color={theme.colors[iconColor]} />;
};
