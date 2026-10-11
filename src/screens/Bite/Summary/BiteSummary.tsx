import type { Soundbite } from "@/graphql";
import type { FC } from "react";
import { ScrollView, View } from "react-native";
import { sharedStyles } from "../styles";
import { BiteDescription } from "./BiteDescription";

export const BiteSummary: FC<{ bite: Soundbite }> = ({ bite }) => {
  return (
    <ScrollView style={sharedStyles.tabPanel}>
      <View style={sharedStyles.container}>
        <BiteDescription bite={bite} />
      </View>
    </ScrollView>
  );
};
