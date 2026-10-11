/**
 * FlashListCompat — drop-in replacement for FlashList that uses FlatList on web.
 *
 * FlashList v2's RecyclerView has a layout loop bug on web where dynamic-height
 * containers cause "Maximum update depth exceeded" crashes (DESKTOP-FF-1R).
 * This component transparently swaps to FlatList on web while keeping FlashList
 * on native for its recycler performance.
 *
 * Accepts the union of FlashList and FlatList props. Platform-specific props
 * are stripped before passing to the underlying component.
 */
import { FlashList, type FlashListProps } from "@shopify/flash-list";
import { type ReactElement, forwardRef } from "react";
import { FlatList, Platform, type FlatListProps } from "react-native";

type FlashListCompatProps<T> = FlashListProps<T> &
  Pick<FlatListProps<T>, "getItemLayout">;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FlashListCompatInner<T>(props: FlashListCompatProps<T>, ref: any) {
  if (Platform.OS === "web") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { overrideProps, onCommitLayoutEffect, ...rest } = props;
    return <FlatList ref={ref} {...(rest as FlatListProps<T>)} />;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { getItemLayout, ...rest } = props;
  return <FlashList ref={ref} {...rest} />;
}

export const FlashListCompat = forwardRef(FlashListCompatInner) as <T>(
  props: FlashListCompatProps<T> & { ref?: React.Ref<unknown> },
) => ReactElement | null;
