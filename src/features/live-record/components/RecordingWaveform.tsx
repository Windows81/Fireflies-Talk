import { recorderApi, useRecorder } from "../record.store";
import { createStyles, useTheme } from "@/styles";
import { useAppState } from "@/utils/app-state";
import { useEffect, useState, type FC } from "react";
import { Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Line, Svg } from "react-native-svg";

const DEFAULT_WIDTH = Dimensions.get("window").width / 2;
const PEAK_WIDTH = 1;
const PEAK_GAP = 3;
const DEFAULT_HEIGHT = 64;

export const normalize = (dbfs: number, min: number, max: number) => {
  const range = max - min;
  const normalizedValue = (dbfs - min) / range;
  const linearNormalized = Math.max(0, Math.min(1, normalizedValue));
  // linear does not represent human perception of loudness
  // so we use a logarithmic scale to convert it
  const logNormalized = Math.pow(10, linearNormalized);
  return logNormalized / 10;
};

export const RecordingWaveform: FC<{ width?: number; height?: number }> = ({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
}) => {
  const theme = useTheme();

  const recordingState = useRecorder((s) => s.status.state);

  const [peaks, setPeaks] = useState<number[]>([]);

  const appState = useAppState();

  const maxPeakCounts = width / (PEAK_GAP + PEAK_WIDTH);

  useEffect(() => {
    // avoid ANR when app is in background
    // since we need to be careful about memory usage in bg
    if (appState !== "active" || recordingState === "inactive") {
      setPeaks([]);
      return;
    }

    let max = 0;
    const setPeak = () => {
      const peak = max;
      max = 0;
      setPeaks((prev) => {
        return [...prev, peak].slice(-maxPeakCounts - 1);
      });
    };

    const sub = recorderApi.addEventListener("status", (status) => {
      // The value ranges from –160 dBFS, indicating minimum power, to 0 dBFS, indicating maximum power
      if (!status.metering || status.state !== "recording") return;
      // Min value is -160, max value is 0
      // However relative silence is around -60
      // https://ffmpeg.org/ffmpeg-filters.html#silencedetect - ffmpeg defaults to -60
      // https://en.wikipedia.org/wiki/DBFS - conversation is around -20
      const metering = normalize(status.metering, -60, 0);
      if (metering > max) {
        max = metering;
      }
      setPeak();
    });
    return () => sub.remove();
  }, [appState, recordingState, maxPeakCounts]);

  const indicatorLeft = (PEAK_GAP + PEAK_WIDTH) * (peaks.length - 1);

  const rootAnimStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(recordingState === "inactive" ? 0 : height),
    };
  }, [recordingState, height]);

  return (
    <Animated.View style={[styles.root(theme), rootAnimStyle]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {peaks.map((peak, index) => {
          const peakHeight = Math.max(peak * height * 0.625, 1);
          const top = (height - peakHeight) / 2;
          const bottom = top + peakHeight;
          const left = index * (PEAK_GAP + PEAK_WIDTH);
          return (
            <Line
              key={`${index}/${peak}`}
              x1={left}
              y1={top}
              x2={left}
              y2={bottom}
              stroke={theme.colors.layerContrast}
              strokeWidth={PEAK_WIDTH}
            />
          );
        })}
        <Line
          x1={indicatorLeft}
          y1={0}
          x2={indicatorLeft}
          y2={height}
          stroke={theme.colors.borderStaticDanger}
          strokeWidth="1"
        />
      </Svg>
    </Animated.View>
  );
};

const styles = createStyles({
  root: (theme) => ({
    width: "100%",
    backgroundColor: theme.colors.layerSubtle,
    flexDirection: "row",
    justifyContent: "flex-start",
  }),
});
