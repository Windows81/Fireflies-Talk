import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";

export const useAutoExpand = (
  shouldExpand: boolean,
): [boolean, Dispatch<SetStateAction<boolean>>] => {
  const [isOpen, setIsOpen] = useState(shouldExpand);
  const [lastShouldExpand, setLastShouldExpand] = useState(shouldExpand);

  if (lastShouldExpand !== shouldExpand) {
    setLastShouldExpand(shouldExpand);
    setIsOpen(shouldExpand);
  }

  return [isOpen, setIsOpen];
};
