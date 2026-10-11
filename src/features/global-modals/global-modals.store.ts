import { create } from "zustand";

type ModalProps = Record<string, any>;

interface GlobalModalsStoreValue {
  modalProps: ModalProps; // a map of modal name to props
  modals: string[];
  openModal: (modal: string, modalProps?: ModalProps) => void;
  closeModal: (closeAll?: boolean) => void;
}

export const useGlobalModalsStore = create<GlobalModalsStoreValue>((set) => ({
  modals: [],
  modalProps: {},
  openModal: (modal: string, modalProps?: ModalProps) => {
    set((state) => {
      if (state.modals.includes(modal)) return state;
      return {
        modals: [...state.modals, modal],
        modalProps: {
          ...state.modalProps,
          [modal]: modalProps,
        },
      };
    });
  },
  closeModal: (closeAll?: boolean) => {
    set((state) => {
      if (closeAll) return { modals: [] };
      return { modals: state.modals.slice(0, -1) };
    });
  },
}));

export const globalModalsApi = useGlobalModalsStore.getState() as Omit<
  GlobalModalsStoreValue,
  "modals" | "modalProps"
>;
