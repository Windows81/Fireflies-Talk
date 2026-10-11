import { IconClose } from "@/assets/svg";
import { Breakpoint, createStyles, useTheme } from "@/styles";
import { getActualPlatform, isDesktop } from "@/utils/device";
import { PortalHost } from "@gorhom/portal";
import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useState,
  type FC,
  type PropsWithChildren,
} from "react";
import type { AccessibilityProps, StyleProp, ViewStyle } from "react-native";
import {
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../Button";
import { Toaster } from "../Toast";
import { Text } from "../Typography";
import { CoordinatedModal } from "./CoordinatedModal";
import type { DialogProps } from "./types";

type DialogContextValue = DialogProps & { id: string };

const DialogContext = createContext({} as DialogContextValue);
const MACOS_TRAFFIC_LIGHT_PADDING = 90;

/**
 *  <Dialog.Root>
 *      <Dialog.Header>Header</Dialog.Header>
 *      {children}
 *  </Dialog.Root>
 */
export const DialogRoot: FC<
  PropsWithChildren<
    DialogProps &
      AccessibilityProps & {
        portalHostname?: string;
        id?: string;
      }
  >
> = ({
  id: modalHtmlId,
  children,
  isOpen,
  close,
  onDismiss,
  variant,
  style,
  overlayStyle,
  portalHostname,
  avoidKeyboard = true,
  ...props
}) => {
  const id = useId();

  const theme = useTheme();

  if (theme.breakpoint >= Breakpoint.Medium) {
    variant = "basic";
  }

  return (
    <CoordinatedModal
      visible={isOpen}
      onRequestClose={close}
      aria-labelledby={`${id}-header`}
      transparent
      onDismiss={onDismiss}
      animationType={variant === "fullscreen" ? "slide" : "fade"}
      id={modalHtmlId}
      {...props}
    >
      <SafeAreaProvider>
        <DialogContext.Provider
          value={{ isOpen, close, id, variant, overlayStyle }}
        >
          <KeyboardAvoidingView
            behavior="padding"
            enabled={avoidKeyboard}
            style={styles.wrapper}
          >
            <DialogOverlay />
            <DialogContent style={style}>{children}</DialogContent>
          </KeyboardAvoidingView>
        </DialogContext.Provider>
        <Toaster />
        {portalHostname && <PortalHost name={portalHostname} />}
      </SafeAreaProvider>
    </CoordinatedModal>
  );
};

const DialogOverlay: FC<PropsWithChildren> = ({ children }) => {
  const theme = useTheme();
  const { close, overlayStyle } = useContext(DialogContext);
  return (
    <Pressable
      style={[
        isDesktop ? styles.overlayDesktop(theme) : styles.overlay(theme),
        overlayStyle,
      ]}
      onPress={close}
      aria-hidden
    >
      {children}
    </Pressable>
  );
};

const DialogContent: FC<
  PropsWithChildren<{
    style?: StyleProp<ViewStyle>;
  }>
> = ({ children, style }) => {
  const theme = useTheme();
  const { variant = "basic" } = useContext(DialogContext);

  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const subShow = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardOpen(true),
    );
    const subHide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardOpen(false),
    );
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  return (
    <SafeAreaView
      style={[styles.content(theme), styles[variant], style]}
      edges={{
        bottom: variant === "bottomSheet" && !keyboardOpen ? "maximum" : "off",
        top: variant === "fullscreen" ? "additive" : "off",
      }}
    >
      {children}
    </SafeAreaView>
  );
};

export const DialogHeader: FC<
  PropsWithChildren<{
    actions?: ReactNode;
    close?: () => void;
    hideCloseOnHeader?: boolean;
    style?: StyleProp<ViewStyle>;
    wrapperStyle?: StyleProp<ViewStyle>;
  }>
> = ({
  children,
  actions,
  close: propClose,
  hideCloseOnHeader,
  style,
  wrapperStyle,
}) => {
  const theme = useTheme();

  const { id, close, variant } = useContext(DialogContext);

  const isStringChildren = Array.isArray(children)
    ? !children.some((child) => typeof child === "object")
    : typeof children !== "object";

  const doClose = propClose || close;

  const closeNode = !hideCloseOnHeader && doClose && (
    <Button
      nativeID="no-drag"
      variant="transparentNeutral"
      size="xs"
      onPress={doClose}
      aria-label="Close dialog"
    >
      <IconClose
        color={theme.colors.commandHintDefault}
        width={20}
        height={20}
      />
    </Button>
  );

  const skipExtraPadding = theme.breakpoint >= Breakpoint.Medium;
  const isMacOSSmallWindow =
    getActualPlatform() === "darwin" &&
    !skipExtraPadding &&
    variant === "fullscreen";

  return (
    <View
      nativeID="drag-region"
      style={[
        styles.header,
        {
          paddingLeft: isMacOSSmallWindow ? MACOS_TRAFFIC_LIGHT_PADDING : 24,
          paddingVertical: isMacOSSmallWindow ? 15 : 20,
          ...wrapperStyle,
        },
      ]}
    >
      <View nativeID="no-drag" style={[styles.headerRow, style]}>
        {!!actions && closeNode}
        {isStringChildren ? (
          <Text
            variant="body1Weight"
            color={"textSecondary"}
            id={`${id}-header`}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
      <View nativeID="no-drag" style={styles.headerRow}>
        {actions ? actions : closeNode}
      </View>
    </View>
  );
};

export const DialogClose: FC = () => {
  const { close } = useContext(DialogContext);

  const theme = useTheme();

  return (
    <TouchableOpacity
      onPress={close}
      aria-label="Close dialog"
      style={styles.topRight}
      role="button"
    >
      <IconClose
        color={theme.colors.commandHintDefault}
        width={20}
        height={20}
      />
    </TouchableOpacity>
  );
};

export const DialogActions: FC<PropsWithChildren> = ({ children }) => {
  return <View style={styles.actions}>{children}</View>;
};

export const DialogBody: FC<PropsWithChildren> = ({ children }) => {
  return <View style={styles.body}>{children}</View>;
};

export const DialogDescription: FC<{ children: string }> = ({ children }) => {
  return (
    <Text variant="body1Regular" color="textSecondary">
      {children}
    </Text>
  );
};

const styles = createStyles({
  overlay: (theme) => ({
    backgroundColor: theme.colors.miscellaneousOverlay,
    ...StyleSheet.absoluteFillObject,
  }),
  overlayDesktop: (theme) => ({
    backgroundColor: theme.colors.miscellaneousSkeletonBackground,
    backdropFilter: "blur(3px)",
    ...StyleSheet.absoluteFillObject,
  }),
  safeArea: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  content: (theme) => ({
    backgroundColor: theme.colors.layerDefault,
    flexDirection: "column",
    zIndex: 1,
  }),
  basic: {
    alignSelf: "center",
    borderRadius: 8,
    width: "85%",
    maxWidth: 560,
    maxHeight: 560,
    overflow: "hidden",
  },
  bottomSheet: {
    borderTopStartRadius: 20,
    borderTopEndRadius: 20,
    alignSelf: "flex-end",
    width: "100%",
    maxWidth: 500,
    maxHeight: "90%",
  },
  fullscreen: {
    width: "100%",
    height: "100%",
  },
  header: {
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    flexShrink: 0,
    flexBasis: "auto",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  body: {
    padding: 20,
    gap: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    padding: 20,
  },
  topRight: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
  },
});
