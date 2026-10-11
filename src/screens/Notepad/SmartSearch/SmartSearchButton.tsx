import { IconSmartSearch } from "@/assets/svg";
import { FabButton } from "@/components/FabButton";
import type { FC } from "react";
import type { SmartSearchFilterState } from "./SmartSearch";

export const SmartSearchButton: FC<{
  onPress: () => void;
  smartSearchFilter: SmartSearchFilterState;
}> = ({ onPress, smartSearchFilter }) => {
  const filterCount = Object.values(smartSearchFilter).reduce(
    (acc, curr) => acc + (curr?.length ?? 0),
    0,
  );

  return (
    <FabButton
      Icon={IconSmartSearch}
      badge={filterCount > 0 ? filterCount : undefined}
      onPress={onPress}
      aria-label={`Smart search ${
        filterCount ? `(${filterCount} filter(s) applied)` : ``
      }`}
    />
  );
};
