import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import type { FC } from "react";
import { StyleSheet, type ModalProps } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Toaster } from "../Toast";
import { CoordinatedModal } from "./CoordinatedModal";

/**
 * BaseModal is a wrapper around the native Modal component
 * that adds Toaster and BottomSheetModalProvider to ensure
 * these components still render on top of the modal.
 */
export const BaseModal: FC<ModalProps> = ({ children, ...props }) => {
  return (
    <CoordinatedModal {...props}>
      <GestureHandlerRootView style={styles.root}>
        <BottomSheetModalProvider>
          {children}
          <Toaster />
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </CoordinatedModal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
