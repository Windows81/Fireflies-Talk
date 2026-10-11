import { HeaderSideContainer } from "@/components/Layout";
import type { FC } from "react";
import { YouHeaderButton } from "src/screens/You";

export const HeaderRight: FC = () => {
  return (
    <HeaderSideContainer forcePadding>
      <YouHeaderButton />
    </HeaderSideContainer>
  );
};
