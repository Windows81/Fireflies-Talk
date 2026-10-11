import {
  FredProvider as BaseFredProvider,
  type FredContextValue,
} from "@firefliesai/fred-react";
import { useTheme } from "@/styles";
import type { FC, ReactNode } from "react";
import { Text, View } from "react-native";
import { createFredClient } from "../utils/fred-client";

interface FredProviderProps {
  children: ReactNode;
}

const fredClient = createFredClient();
const FredComponents: FredContextValue["Components"] = {
  StatusText({ message, status }) {
    const theme = useTheme();
    if (status !== "processing" && status !== "completed") return null;
    return (
      <View style={{ padding: 8, alignItems: "center" }}>
        <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>
          {message}
        </Text>
      </View>
    );
  },
};

export const FredProvider: FC<FredProviderProps> = ({ children }) => {
  return (
    <BaseFredProvider
      client={fredClient}
      Components={FredComponents}
      injectFootnoteDefinitions
    >
      {children}
    </BaseFredProvider>
  );
};
