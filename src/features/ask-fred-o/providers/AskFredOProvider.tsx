import { createFredClient } from "@/features/ask-fred/utils/fred-client";
import {
  FredProvider as BaseFredProvider,
  ThreadProvider,
  type FredContextValue,
} from "@firefliesai/fred-react";
import type { FC, ReactNode } from "react";
import { ASK_FRED_O_SOURCE } from "../constants";
import { AskFredOSubmitProvider } from "../hooks/useAskFredOSubmit";
import { askFredOPartComponents } from "./askFredOPartComponents";
import { AskFredOScopeProvider } from "./AskFredOScopeProvider";

const fredComponents: FredContextValue["Components"] = {};

export const AskFredOProvider: FC<{
  children: ReactNode;
  isOpen: boolean;
}> = ({ children, isOpen }) => (
  <BaseFredProvider
    client={createFredClient()}
    Components={fredComponents}
    PartComponents={askFredOPartComponents}
    injectFootnoteDefinitions
    source={ASK_FRED_O_SOURCE}
  >
    <ThreadProvider>
      <AskFredOScopeProvider>
        <AskFredOSubmitProvider isOpen={isOpen}>
          {children}
        </AskFredOSubmitProvider>
      </AskFredOScopeProvider>
    </ThreadProvider>
  </BaseFredProvider>
);
