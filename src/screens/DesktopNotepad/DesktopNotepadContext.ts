import { createContext, useContext } from "react";
import type { DesktopNotepadContextValue } from "./types";

export const DesktopNotepadContext =
  createContext<DesktopNotepadContextValue | null>(null);

export const useDesktopNotepadContext = (): DesktopNotepadContextValue => {
  const context = useContext(DesktopNotepadContext);
  if (!context) {
    throw new Error(
      "useDesktopNotepadContext used outside DesktopNotepadContent",
    );
  }
  return context;
};
