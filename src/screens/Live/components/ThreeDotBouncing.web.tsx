import { type FC, useEffect, useState } from "react";
import { View } from "react-native";
import { ShimmerText } from "@/components/Typography";
import { createStyles, useTheme } from "@/styles";

const progressiveMessages = [
  "Listening",
  "Extracting key insights",
  "Summarizing notes",
];

const MESSAGE_INTERVAL = 6000;
const DOTS_INTERVAL = 1500;
const DOT_DELAYS = ["0s", "0.3s", "0.6s"];

if (typeof document !== "undefined") {
  const styleId = "three-dot-bounce-keyframes";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes dot-bounce {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-7px);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

type ThreeDotBouncingAnimProps = {
  showMessages?: boolean;
  renderAnimImmediate?: boolean;
};

export const ThreeDotBouncingAnim: FC<ThreeDotBouncingAnimProps> = ({
  showMessages = true,
  renderAnimImmediate = false,
}) => {
  const theme = useTheme();
  const [messageIndex, setMessageIndex] = useState(0);
  const [renderAnim, setRenderAnim] = useState(renderAnimImmediate);

  useEffect(() => {
    const timeOut = setTimeout(() => {
      setRenderAnim(true);
    }, DOTS_INTERVAL);

    return () => clearTimeout(timeOut);
  }, []);

  useEffect(() => {
    if (!showMessages) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % progressiveMessages.length);
    }, MESSAGE_INTERVAL);

    return () => clearInterval(interval);
  }, [showMessages]);

  if (!renderAnim) {
    return null;
  }

  return (
    <View
      style={[styles.container, showMessages && styles.containerWithMessages]}
    >
      <View style={styles.dotsContainer}>
        {DOT_DELAYS.map((delay, i) => (
          <View
            key={i}
            style={[
              styles.dot(theme),
              {
                animation: "dot-bounce 1.5s ease-in-out infinite",
                animationDelay: delay,
              } as any,
            ]}
          />
        ))}
      </View>
      {showMessages && (
        <ShimmerText variant="body2Regular" color="textHint">
          {progressiveMessages[messageIndex] || "Listening"}
        </ShimmerText>
      )}
    </View>
  );
};

const styles = createStyles({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  // Spacing for the Live notes layout where the dots sit under content with
  // a message label beside them. Compact embeds (dictation pill, header) omit
  // this so the dots stay vertically centered in their parent.
  containerWithMessages: {
    marginTop: 12,
    gap: 12,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 23,
    gap: 3,
  },
  dot: (theme) => ({
    width: 4,
    height: 4,
    backgroundColor: theme.colors.rainbowStaticPurpleSolid,
    borderRadius: 2,
  }),
});
