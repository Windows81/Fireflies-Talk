import { Breakpoint, createStyles, useTheme } from "@/styles";
import type {
  BottomSheetBackdropProps,
  BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
  BottomSheetView,
  TouchableHighlight,
  useBottomSheetModal,
} from "@gorhom/bottom-sheet";
import { useIsFocused } from "@react-navigation/native";
import type { PropsWithChildren } from "react";
import { useEffect, useRef, useState, type FC } from "react";
import { BackHandler, Dimensions, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { responsiveSizes } from "src/styles/breakpoint";
import { Text } from "../Typography";

interface BottomSheetProps {
  snapPoints?: (number | `${number}%`)[];
  isOpen: boolean;
  close?: () => void;
  footerComponent?: FC<BottomSheetFooterProps>;
}

const renderBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
);

const MAX_WIDTH = responsiveSizes.medium;

const BottomSheetRoot: FC<PropsWithChildren<BottomSheetProps>> = ({
  children,
  isOpen,
  snapPoints,
  close,
  footerComponent,
}) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const shouldPresentRef = useRef(false);
  const [modalKey, setModalKey] = useState(0);

  const isFocused = useIsFocused();
  shouldPresentRef.current = isOpen && (Platform.OS === "web" || isFocused);

  useEffect(() => {
    let presentTimeout: ReturnType<typeof setTimeout> | undefined;

    if (isOpen && Platform.OS === "web") {
      // Force remount on web to reset modal state
      setModalKey((prev) => prev + 1);
      // Small delay to ensure the component is remounted before presenting
      presentTimeout = setTimeout(() => {
        bottomSheetRef.current?.present();
      }, 50);
    } else if (isOpen && isFocused) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }

    return () => {
      if (presentTimeout) clearTimeout(presentTimeout);
    };
  }, [isOpen, isFocused]);

  const safeAreaInset = useSafeAreaInsets();

  const theme = useTheme();

  const [windowWidth, setWindowWidth] = useState(
    () => Dimensions.get("window").width,
  );
  useEffect(() => {
    // TODO: find a better way to center the sheet on native
    if (Platform.OS === "web" || theme.breakpoint < Breakpoint.Medium) return;
    const subscription = Dimensions.addEventListener("change", ({ window }) =>
      setWindowWidth(window.width),
    );
    return () => subscription.remove();
  }, [theme.breakpoint]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      key={Platform.OS === "web" ? modalKey : undefined}
      backdropComponent={renderBackdrop}
      footerComponent={footerComponent}
      accessible={false}
      accessibilityLabel={null}
      accessibilityRole={null}
      enablePanDownToClose
      // Gorhom's default "switch" minimizes the sheet below, and a minimized sheet
      // never fires onDismiss, so a later restore brings back one already closed.
      stackBehavior="push"
      onDismiss={close}
      onAnimate={(_, toIndex) => {
        // Gorhom 5.2.8 defers present to rAF, so a close can race with it.
        // Its next index is set before this callback, so dismiss force-closes.
        if (toIndex >= 0 && !shouldPresentRef.current) {
          bottomSheetRef.current?.dismiss();
        }
      }}
      handleIndicatorStyle={styles.handleIndicator(theme)}
      handleStyle={styles.handleStyle}
      topInset={safeAreaInset.top}
      backgroundStyle={styles.background(theme)}
      // Phones attach the sheet so it extends behind the keyboard; detached
      // sheets stop at its top edge and show the backdrop at its rounded corners.
      detached={theme.breakpoint >= Breakpoint.Medium}
      {...(snapPoints
        ? { snapPoints, enableDynamicSizing: false }
        : { enableDynamicSizing: true })}
      {...(theme.breakpoint >= Breakpoint.Medium && {
        style: [
          styles.detachedSheetContainer,
          Platform.select({
            web: { maxWidth: 500, marginHorizontal: "auto" },
            default: {
              marginHorizontal: (windowWidth - MAX_WIDTH) / 2,
            },
          }),
        ],
        bottomInset: safeAreaInset.bottom + 36,
      })}
    >
      {children}
    </BottomSheetModal>
  );
};

const BottomSheetHeader: FC<PropsWithChildren> = ({ children }) => {
  const theme = useTheme();

  const isStringChildren = Array.isArray(children)
    ? !children.some((child) => typeof child === "object")
    : typeof children !== "object";

  return (
    <View style={styles.header(theme)}>
      {isStringChildren ? (
        <Text variant="body1Weight">{children}</Text>
      ) : (
        children
      )}
    </View>
  );
};

const BottomSheetBackHandler: FC<PropsWithChildren> = ({ children }) => {
  const { dismiss } = useBottomSheetModal();

  useEffect(() => {
    if (Platform.OS !== "android") return;
    // Gorhom portal modals do not inherit React Native Modal's Android Back handling.
    const subscription = BackHandler.addEventListener("hardwareBackPress", () =>
      dismiss(),
    );
    return () => subscription.remove();
  }, [dismiss]);

  return children;
};

const BottomSheetModalProviderFF: FC<PropsWithChildren> = ({ children }) => (
  <BottomSheetModalProvider>
    <BottomSheetBackHandler>{children}</BottomSheetBackHandler>
  </BottomSheetModalProvider>
);

const styles = createStyles({
  header: (theme) => ({
    padding: 20,
    borderBottomColor: theme.colors.borderStaticDefault,
    borderBottomWidth: 1,
    flexShrink: 0,
  }),
  handleIndicator: (theme) => ({
    backgroundColor: theme.colors.textHint,
    opacity: 0.4,
  }),
  handleStyle: {
    marginTop: 8,
    height: 24,
  },
  detachedSheetContainer: {
    maxWidth: MAX_WIDTH,
    width: "100%",
  },
  background: (theme) => ({
    // Dark only: sit one step lighter than the page so sheets read as a
    // distinct surface (page #0C0C0D -> sheet #141415). Light keeps pure white.
    backgroundColor:
      theme.name === "dark"
        ? theme.colors.layerSubtle
        : theme.colors.layerDefault,
  }),
});

export const BottomSheetFF = {
  Root: BottomSheetRoot,
  Header: BottomSheetHeader,
  View: BottomSheetView,
  ScrollView: BottomSheetScrollView,
  FlatList: BottomSheetFlatList,
  Footer: BottomSheetFooter,
  TouchableHighlight,
  ModalProvider: BottomSheetModalProviderFF,
};
