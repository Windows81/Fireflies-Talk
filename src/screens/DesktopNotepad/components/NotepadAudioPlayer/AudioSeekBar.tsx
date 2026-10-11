import { createStyles, useTheme } from "@/styles";
import { useMemo, useRef, useState, type FC } from "react";
import { PanResponder, View, type LayoutChangeEvent } from "react-native";

const TRACK_HEIGHT = 4;
const THUMB_SIZE = 10;

export const AudioSeekBar: FC<{
  current: number;
  duration: number;
  onScrubStart: () => void;
  onScrub: (value: number) => void;
  onScrubCommit: (value: number) => void;
}> = ({ current, duration, onScrubStart, onScrub, onScrubCommit }) => {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);

  const widthRef = useRef(0);
  // Latest values are read through a ref so the gesture handlers, created once,
  // never seek against a stale duration or callback.
  const cfg = useRef({ duration, onScrubStart, onScrub, onScrubCommit });
  cfg.current = { duration, onScrubStart, onScrub, onScrubCommit };

  const ratio = duration > 0 ? Math.min(Math.max(current / duration, 0), 1) : 0;

  const panResponder = useMemo(() => {
    const valueAt = (x: number) => {
      const width = widthRef.current;
      if (width <= 0) return 0;
      return Math.min(Math.max(x / width, 0), 1) * cfg.current.duration;
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        setDragging(true);
        cfg.current.onScrubStart();
        cfg.current.onScrub(valueAt(event.nativeEvent.locationX));
      },
      onPanResponderMove: (event) => {
        cfg.current.onScrub(valueAt(event.nativeEvent.locationX));
      },
      onPanResponderRelease: (event) => {
        cfg.current.onScrubCommit(valueAt(event.nativeEvent.locationX));
        setDragging(false);
      },
      onPanResponderTerminate: (event) => {
        cfg.current.onScrubCommit(valueAt(event.nativeEvent.locationX));
        setDragging(false);
      },
    });
  }, []);

  const onLayout = (event: LayoutChangeEvent) => {
    widthRef.current = event.nativeEvent.layout.width;
  };

  const thumbVisible = hovered || dragging;

  return (
    <View
      style={styles.root}
      onLayout={onLayout}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      hitSlop={8}
      {...panResponder.panHandlers}
    >
      <View style={styles.track(theme)}>
        <View style={[styles.fill(theme), { width: `${ratio * 100}%` }]} />
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.thumb(theme),
          { left: `${ratio * 100}%`, opacity: thumbVisible ? 1 : 0 },
        ]}
      />
    </View>
  );
};

const styles = createStyles({
  root: {
    flex: 1,
    height: 16,
    justifyContent: "center",
  },
  track: (theme) => ({
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: theme.colors.layerAlphaDefault,
    overflow: "hidden",
  }),
  fill: (theme) => ({
    height: "100%",
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: theme.colors.commandNeutralDefault,
  }),
  thumb: (theme) => ({
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    marginLeft: -THUMB_SIZE / 2,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: theme.colors.commandNeutralDefault,
  }),
});
