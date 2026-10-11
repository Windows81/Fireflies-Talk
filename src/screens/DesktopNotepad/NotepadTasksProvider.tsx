import { createContext, useContext, type FC, type ReactNode } from "react";
import {
  useNotepadTasks,
  type NotepadTasksValue,
} from "./hooks/useNotepadTasks";

const NotepadTasksContext = createContext<NotepadTasksValue | null>(null);

export const useNotepadTasksContext = (): NotepadTasksValue => {
  const context = useContext(NotepadTasksContext);
  if (!context) {
    throw new Error("useNotepadTasksContext used outside NotepadTasksProvider");
  }
  return context;
};

export const NotepadTasksProvider: FC<{
  meetingId: string;
  children: ReactNode;
}> = ({ meetingId, children }) => {
  const value = useNotepadTasks(meetingId);
  return (
    <NotepadTasksContext.Provider value={value}>
      {children}
    </NotepadTasksContext.Provider>
  );
};
