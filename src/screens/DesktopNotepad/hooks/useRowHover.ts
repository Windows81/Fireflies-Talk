import { useEffect, useRef, useState } from "react";
import { Platform, type View } from "react-native";

// Hover via DOM mouseenter/mouseleave. RNW Pressable hover uses a bubbling
// "contain" lock that turns an ancestor's hover off whenever a descendant
// Pressable is hovered, which breaks reveal-on-hover (e.g. the @assign pill).
// mouseenter/mouseleave don't bubble and stay active over children.
export const useRowHover = () => {
  const ref = useRef<View>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const node = ref.current as unknown as HTMLElement | null;
    if (!node) return;

    const enter = () => setIsHovered(true);
    const leave = () => setIsHovered(false);
    node.addEventListener("mouseenter", enter);
    node.addEventListener("mouseleave", leave);

    return () => {
      node.removeEventListener("mouseenter", enter);
      node.removeEventListener("mouseleave", leave);
    };
  }, []);

  return { ref, isHovered };
};
