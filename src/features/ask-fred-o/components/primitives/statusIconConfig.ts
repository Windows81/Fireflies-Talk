import { IconAlertCircle, IconCheckCircle } from "@/assets/svg";
import type { Theme } from "@/styles";
import type { ComponentType } from "react";
import type { SvgProps } from "react-native-svg";

export type FredPartStatus = "processing" | "completed" | "failed";

interface FredPartStatusVisual {
  Icon: ComponentType<SvgProps> | null;
  iconColor: keyof Theme["colors"];
  labelColor: keyof Theme["colors"];
}

export const statusIconConfig: Record<FredPartStatus, FredPartStatusVisual> = {
  completed: {
    Icon: IconCheckCircle,
    iconColor: "informationInteractiveGreenDefault",
    labelColor: "textSecondary",
  },
  failed: {
    Icon: IconAlertCircle,
    iconColor: "interactiveDangerPrimaryDefault",
    labelColor: "informationStaticRedText",
  },
  processing: {
    Icon: null,
    iconColor: "textBrand",
    labelColor: "textHint",
  },
};

export const resolveFredPartStatus = (
  status: string | undefined,
): FredPartStatus =>
  status === "completed" || status === "failed" ? status : "processing";
