import type { Caption } from "@/features/transcript";
import type { Meeting, Soundbite } from "@/graphql";
import type { Dispatch, SetStateAction } from "react";
import { createContext, useContext } from "react";
import type { SmartSearchFilterState } from "./SmartSearch";

export const NotepadScreenContext = createContext(
  {} as {
    meeting: Meeting;

    // === Transcript ===
    captions: Caption[] | undefined;
    search: string;
    setSearch: Dispatch<SetStateAction<string>>;

    // === Dialogs ===
    isOpenShare: boolean;
    openShare: () => void;
    closeShare: () => void;
    isOpenMenu: boolean;
    openMenu: () => void;
    closeMenu: () => void;

    // === Create Soundbite ===
    createdBite: Soundbite | null;
    setCreatedBite: Dispatch<SetStateAction<Soundbite | null>>;
    isOpenCreateSoundbiteModal: boolean;
    openCreateSoundbiteModal: () => void;
    closeCreateSoundbiteModal: () => void;

    // === AskFred ===
    isOpenAskFredModal: boolean;
    openAskFredModal: () => void;
    closeAskFredModal: () => void;
    aiModel: string;
    setAiModel: Dispatch<SetStateAction<string>>;

    // === Mobile overlay ===
    mobileOverlay: "search" | "thread" | "add-soundbite" | null;
    setMobileOverlay: Dispatch<
      SetStateAction<"search" | "thread" | "add-soundbite" | null>
    >;

    // === Smart Search ===
    smartSearchFilter: SmartSearchFilterState;
    setSmartSearchFilter: Dispatch<SetStateAction<SmartSearchFilterState>>;
    isOpenSmartSearchModal: boolean;
    openSmartSearchModal: () => void;
    closeSmartSearchModal: () => void;

    // === Player ===
    videoHidden: boolean;

    // === misc ===
    isFocused: boolean;
    trackViewingFeature: (feature: "transcript" | "bites") => void;
  },
);

export const useNotepadScreenContext = () => useContext(NotepadScreenContext);
