import { useRef, useState } from "react";
import {
  useCompactPanelSizeStore,
  MIN_PANEL_WIDTH,
  MAX_PANEL_WIDTH,
  MAX_PANEL_HEIGHT,
  minPanelHeightFor,
  type ResizablePanelKind,
  type PanelSize,
} from "@/features/live/compactPanelSize.store";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export interface CompactPanelResize {
  /** Live size of the active right card (drag value while dragging, else stored). */
  rightSize: PanelSize;
  /** True while a resize drag is in progress. */
  isResizing: boolean;
  handleResizeStart: () => void;
  handleResize: (dx: number, dy: number) => void;
  handleResizeEnd: () => void;
}

/**
 * Drag-to-resize state for the active right panel card (Notes or Ask Fred).
 * `dragSize` is the live value while dragging (kept local so we don't write to
 * persisted storage every frame); it commits to the store on release. A ref
 * mirrors it so the commit reads the latest size without doing side effects
 * inside a state updater.
 */
export function useCompactPanelResize(
  rightPanelKind: ResizablePanelKind,
): CompactPanelResize {
  const { sizes, setSize } = useCompactPanelSizeStore();
  const [dragSize, setDragSize] = useState<PanelSize | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef<PanelSize>(sizes[rightPanelKind]);
  const dragSizeRef = useRef<PanelSize | null>(null);

  // Clamp the persisted height too, so a size saved before the per-kind
  // minimum existed can't render the panel shorter than allowed.
  const storedSize = sizes[rightPanelKind];
  const rightSize: PanelSize = dragSize ?? {
    width: storedSize.width,
    height: Math.max(storedSize.height, minPanelHeightFor(rightPanelKind)),
  };

  const handleResizeStart = () => {
    dragStartRef.current = sizes[rightPanelKind];
    setIsResizing(true);
  };

  const handleResize = (dx: number, dy: number) => {
    const start = dragStartRef.current;
    const next: PanelSize = {
      width: clamp(start.width + dx, MIN_PANEL_WIDTH, MAX_PANEL_WIDTH),
      height: clamp(
        start.height + dy,
        minPanelHeightFor(rightPanelKind),
        MAX_PANEL_HEIGHT,
      ),
    };
    dragSizeRef.current = next;
    setDragSize(next);
  };

  const handleResizeEnd = () => {
    const finalSize = dragSizeRef.current;
    if (finalSize) {
      setSize(rightPanelKind, finalSize.width, finalSize.height);
    }
    dragSizeRef.current = null;
    setDragSize(null);
    setIsResizing(false);
  };

  return {
    rightSize,
    isResizing,
    handleResizeStart,
    handleResize,
    handleResizeEnd,
  };
}
