import type { FC, PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { ScrollView, View } from "react-native";

/**
 * Allows children to receive taps even when the keyboard is open.
 */
export const KeyboardPersistTapsView: FC<
  PropsWithChildren<{
    style?: StyleProp<ViewStyle>;
    contentContainerStyle?: StyleProp<ViewStyle>;
  }>
> = ({ children, style, contentContainerStyle }) => {
  return (
    <View style={style}>
      <ScrollView
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="always"
        scrollEnabled={false}
      >
        {children}
      </ScrollView>
    </View>
  );
};
