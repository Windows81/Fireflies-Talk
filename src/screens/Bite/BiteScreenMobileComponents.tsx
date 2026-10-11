import { Tabs } from "@/components/Tabs";
import type { Soundbite } from "@/graphql";
import type { FC } from "react";
import { BiteSummary } from "./Summary/BiteSummary";
import { BiteTranscript } from "./Transcript/BiteTranscript";

export const BiteScreenMobileTabs: FC<{
  bite: Soundbite;
  isStillLoading: boolean;
}> = ({ bite, isStillLoading }) => {
  if (isStillLoading) return null;

  return (
    <Tabs.Root>
      <Tabs.Panel name="summary" title="Summary">
        <BiteSummary bite={bite} />
      </Tabs.Panel>
      <Tabs.Panel name="transcript" title="Transcript">
        <BiteTranscript bite={bite} />
      </Tabs.Panel>
    </Tabs.Root>
  );
};
