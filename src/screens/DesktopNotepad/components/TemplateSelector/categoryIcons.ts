import {
  IconDollarSign,
  IconEdit,
  IconHeadphone,
  IconList,
  IconUsers,
} from "@/assets/svg";
import type { FC } from "react";
import type { SvgProps } from "react-native-svg";
import {
  IconRecruiting,
  IconHealthcare,
  IconVentureCapital,
} from "@/assets/svg";
// Summary-template categories are backend-driven; map the known ones to icons
// and fall back to a neutral list glyph for anything new.
const CATEGORY_ICONS: Record<string, FC<SvgProps>> = {
  internal: IconUsers,
  sales: IconHeadphone,
  finance: IconDollarSign,
  healthcare: IconHealthcare,
  recruiting: IconRecruiting,
  "venture capital": IconVentureCapital,
  custom: IconEdit,
};

export const getCategoryIcon = (name: string): FC<SvgProps> =>
  CATEGORY_ICONS[name.trim().toLowerCase()] ?? IconList;
