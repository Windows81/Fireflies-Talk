import { MenuItem, MenuPopover } from "@/components/Menu";
import { createStyles } from "@/styles";
import { copyAsText } from "@/utils/clipboard";
import {
  type FC,
  type PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from "react";
import { View, type ViewStyle } from "react-native";

/**
 * Wraps the transcript and adds a right-click "Copy" menu for the current text
 * selection.
 */
export const TranscriptCopyMenu: FC<PropsWithChildren> = ({ children }) => {
  const containerRef = useRef<View>(null);
  const anchorRef = useRef<View>(null);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const node = containerRef.current as unknown as HTMLElement | null;
    if (!node) return;

    const handleContextMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      // Leave inputs (e.g. the search box) to their native behavior.
      if (target?.closest("input, textarea")) return;

      event.preventDefault();
      setSelectedText(window.getSelection?.()?.toString().trim() ?? "");
      setPoint({ x: event.clientX, y: event.clientY });
      setIsOpen(true);
    };

    node.addEventListener("contextmenu", handleContextMenu);
    return () => node.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  const handleCopy = () => {
    if (selectedText) void copyAsText(selectedText);
    setIsOpen(false);
  };

  return (
    <View ref={containerRef} style={styles.root}>
      {children}
      {point && (
        <View
          ref={anchorRef}
          pointerEvents="none"
          style={
            {
              position: "fixed",
              left: point.x,
              top: point.y,
              width: 1,
              height: 1,
            } as unknown as ViewStyle
          }
        />
      )}
      <MenuPopover
        isOpen={isOpen}
        close={() => setIsOpen(false)}
        triggerRef={anchorRef}
        width={160}
      >
        <MenuItem label="Copy" onPress={handleCopy} disabled={!selectedText} />
      </MenuPopover>
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
  },
});
