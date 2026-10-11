import type { FC } from "react";
import { Modal, type ModalProps } from "react-native";
import {
  ModalPresentationScope,
  useModalPresentation,
} from "./modal-presentation";

/**
 * A drop-in replacement for react-native's `Modal` that takes part in the
 * presentation queue, so it can never collide with another modal and wedge the
 * app (see PresentationSlot for what goes wrong without it).
 *
 * Use it instead of `Modal` everywhere, including for third-party components
 * that render their own — `react-native-walkthrough-tooltip` takes it via its
 * `modalComponent` prop.
 */
export const CoordinatedModal: FC<ModalProps> = ({
  children,
  visible,
  onDismiss,
  ...props
}) => {
  // Modal's own default for `visible` is true, so an omitted prop means visible.
  const presentation = useModalPresentation(visible !== false, onDismiss);

  return (
    <Modal
      {...props}
      visible={presentation.visible}
      onDismiss={presentation.onDismiss}
    >
      <ModalPresentationScope.Provider value={presentation.scope}>
        {children}
      </ModalPresentationScope.Provider>
    </Modal>
  );
};
