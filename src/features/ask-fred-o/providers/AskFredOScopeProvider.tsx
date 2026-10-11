import type { FC, ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import type { AskFredOScope } from "../helpers/toMeetingFilters";
import { ALL_CHANNELS, ANY_TIME } from "../helpers/toMeetingFilters";

export const DEFAULT_ASK_FRED_O_SCOPE: AskFredOScope = {
  range: ANY_TIME,
  channelId: ALL_CHANNELS,
};

interface AskFredOScopeContextValue {
  scope: AskFredOScope;
  setScope: (scope: AskFredOScope) => void;
}

const AskFredOScopeContext = createContext<AskFredOScopeContextValue>({
  scope: DEFAULT_ASK_FRED_O_SCOPE,
  setScope: () => undefined,
});

export const useAskFredOScope = (): AskFredOScopeContextValue =>
  useContext(AskFredOScopeContext);

export const AskFredOScopeProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [scope, setScope] = useState<AskFredOScope>(DEFAULT_ASK_FRED_O_SCOPE);

  return (
    <AskFredOScopeContext.Provider value={{ scope, setScope }}>
      {children}
    </AskFredOScopeContext.Provider>
  );
};
