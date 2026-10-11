import type { FC } from "react";

const STYLE_ID = "bottom-border-glow-keyframes";

// Reconstructed from lottie source (1440x350 viewport).
// 4 blurred ellipses orbiting, masked by a soft horizontal streak.
// Positions converted to % of viewport: x/1440*100, y/350*100.
// Easing matches lottie bezier handles: cubic-bezier(0.33, 0, 0.67, 1).
// Orb centers positioned around 50-80% of the 400px container height,
// so they sit in the lower half with only blurred tops visible above.
const cssKeyframes = `
@keyframes orb-green {
  0%,100% { left: 78.2%; top: 55% }
  25%     { left: 25.3%; top: 65% }
  50%     { left: 26.1%; top: 80% }
  75%     { left: 78.4%; top: 75% }
}
@keyframes orb-orange {
  0%,100% { left: 79.4%; top: 75% }
  25%     { left: 85.7%; top: 60% }
  50%     { left: 42.4%; top: 55% }
  75%     { left: 36.0%; top: 80% }
}
@keyframes orb-purple {
  0%,100% { left: 39.4%; top: 80% }
  25%     { left: 88.3%; top: 70% }
  50%     { left: 83.9%; top: 55% }
  75%     { left: 32.9%; top: 50% }
}
@keyframes orb-blue {
  0%,100% { left: 32.8%; top: 65% }
  25%     { left: 54.0%; top: 75% }
  50%     { left: 72.4%; top: 78% }
  75%     { left: 66.7%; top: 58% }
}`;

function injectKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = cssKeyframes;
  document.head.appendChild(style);
}

const orbBase: React.CSSProperties = {
  position: "absolute",
  width: "59%", // 849/1440 ≈ 59% of container width
  aspectRatio: "1",
  borderRadius: "50%",
  filter: "blur(130px)",
  willChange: "left, top",
  animationDuration: "5s",
  animationIterationCount: "infinite",
  animationTimingFunction: "cubic-bezier(0.33, 0, 0.67, 1)",
  marginLeft: "-29.5%",
  marginTop: "-29.5%",
};

export const BottomBorderGlow: FC = () => {
  injectKeyframes();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        opacity: 0.7,
        // Fullscreen soft glow mask (replaces comet PNG at 30% opacity).
        // Wide horizontal ellipse anchored at bottom, fading to transparent.
        WebkitMaskImage:
          "radial-gradient(ellipse 100% 90% at 50% 100%, rgba(0,0,0,0.3) 0%, transparent 70%)",
        maskImage:
          "radial-gradient(ellipse 100% 90% at 50% 100%, rgba(0,0,0,0.3) 0%, transparent 70%)",
      }}
    >
      <div
        style={{
          ...orbBase,
          background: "rgb(136, 255, 203)",
          animationName: "orb-green",
        }}
      />
      <div
        style={{
          ...orbBase,
          background: "rgb(255, 210, 143)",
          animationName: "orb-orange",
        }}
      />
      <div
        style={{
          ...orbBase,
          background: "rgb(156, 98, 255)",
          animationName: "orb-purple",
        }}
      />
      <div
        style={{
          ...orbBase,
          background: "rgb(87, 127, 255)",
          animationName: "orb-blue",
        }}
      />
    </div>
  );
};
