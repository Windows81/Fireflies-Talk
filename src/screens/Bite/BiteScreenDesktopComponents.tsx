import { SectionHeader } from "@/components/Layout";
import type { Soundbite } from "@/graphql";
import { createStyles } from "@/styles";
import type { FC } from "react";
import { View } from "react-native";
import { BiteTranscript } from "./Transcript/BiteTranscript";

export const BiteScreenDesktopSide: FC<{
  bite: Soundbite;
}> = ({ bite }) => {
  return (
    <View style={styles.side}>
      <SectionHeader title="Transcript" />
      <BiteTranscript bite={bite} />
    </View>
  );
};

const styles = createStyles({
  side: {
    flexDirection: "column",
    flex: 1,
  },
});
