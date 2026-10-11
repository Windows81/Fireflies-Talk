import { IconTranscriptWave } from "@/assets/svg";
import { createStyles } from "@/styles";
import { memo } from "react";
import { View, type ViewStyle } from "react-native";

const BAR_DELAYS = ["0s", "0.27s", "0.54s"];
const ANIMATION_DURATION = "1.35s";

// Equalizer keyframes injected once; each bar scales vertically from its center.
if (typeof document !== "undefined") {
  const styleId = "transcript-wave-keyframes";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes transcript-wave-bar {
        0%, 100% { transform: scaleY(0.4); }
        50% { transform: scaleY(1); }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Three-bar equalizer shown next to the Transcript tab label. While `active`
 * the bars animate; when idle it falls back to the static waveform glyph.
 */
export const AnimatedTranscriptWaveIcon = memo(
  function AnimatedTranscriptWaveIcon({
    color,
    size = 18,
    active = true,
  }: {
    color: string;
    size?: number;
    active?: boolean;
  }) {
    if (!active) {
      return <IconTranscriptWave width={size} height={size} color={color} />;
    }

    return (
      <View style={[styles.container, { width: size, height: size }]}>
        {BAR_DELAYS.map((delay, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              { backgroundColor: color, height: size * 0.66 },
              active
                ? ({
                    animation: `transcript-wave-bar ${ANIMATION_DURATION} ease-in-out infinite`,
                    animationDelay: delay,
                  } as unknown as ViewStyle)
                : undefined,
            ]}
          />
        ))}
      </View>
    );
  },
);

const styles = createStyles({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2.5,
  },
  bar: {
    width: 1.5,
    borderRadius: 1,
  },
});
