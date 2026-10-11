import { IconClose } from "@/assets/svg";
import { Text } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";
import { useEffect, useState, type FC, type PropsWithChildren } from "react";
import { Keyboard, Platform, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

export const NotepadContentOverlay: FC<
  PropsWithChildren<{
    header?: string;
    close?: () => void;
  }>
> = ({ children, header, close }) => {
  const theme = useTheme();

  // TODO: find how to use KeyboardAvoidingView
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    // on android, we already set windowSoftInputMode="adjustResize"
    if (Platform.OS !== "ios") return;
    const subShow = Keyboard.addListener("keyboardDidShow", (ev) =>
      setKeyboardHeight(ev.endCoordinates.height),
    );
    const subHide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardHeight(0),
    );
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.root(theme),
        {
          paddingBottom: keyboardHeight,
        },
      ]}
      entering={FadeInDown}
      exiting={FadeOutDown}
      aria-modal
    >
      {header && (
        <View style={styles.header(theme)}>
          <Text variant="body1Weight">{header}</Text>
          {close && (
            <TouchableOpacity onPress={close} aria-label="Close" role="button">
              <IconClose
                color={theme.colors.commandHintDefault}
                width={20}
                height={20}
              />
            </TouchableOpacity>
          )}
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
    backgroundColor: theme.colors.layerDefault,
    height: "100%",
    width: "100%",
  }),
  header: (theme) => ({
    padding: 20,
    borderBottomColor: theme.colors.borderStaticDefault,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  }),
  content: {
    flex: 1,
  },
});
