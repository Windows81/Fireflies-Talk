import { useEffect, useRef } from "react";
import type { Text } from "react-native";

/**
 * Puts the browser's own tooltip on a truncated element.
 *
 * React Native Web drops unrecognised DOM props, so `title` cannot simply be
 * passed through — it is set on the node. Used where text is clipped and the
 * whole of it is still worth reading.
 */
export function useNativeTitle(title: string) {
  const ref = useRef<Text>(null);

  useEffect(() => {
    const node = ref.current as unknown as HTMLElement | null;
    if (node) node.title = title;
  }, [title]);

  return ref;
}
