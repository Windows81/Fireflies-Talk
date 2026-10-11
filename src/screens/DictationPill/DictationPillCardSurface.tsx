import { useTheme } from "@/styles";
import {
  DICTATION_PILL_CARD_ARROW_LENGTH,
  DICTATION_PILL_CARD_ARROW_OVERLAP,
  DICTATION_PILL_CARD_ARROW_SPAN,
} from "electron/src/dictation/dictation-pill-anchored-layout";
import type { DictationPillSide } from "electron/src/types";
import { useId } from "react";
import Svg, {
  Defs,
  FeBlend,
  FeComposite,
  FeFlood,
  FeGaussianBlur,
  FeOffset,
  Filter,
  Path,
} from "react-native-svg";

const ARROW_DEPTH =
  DICTATION_PILL_CARD_ARROW_LENGTH - DICTATION_PILL_CARD_ARROW_OVERLAP;
const HALF_ARROW = DICTATION_PILL_CARD_ARROW_SPAN / 2;
const RADIUS = 11.5;
const SURFACE_STYLE = {
  position: "absolute",
  top: 0,
  left: 0,
  colorInterpolationFilters: "sRGB",
} as const;

/**
 * The rounded card outline every pill-anchored card draws behind itself,
 * arrow bump included. `width`/`height` are the card's own size; the arrow
 * extends past the edge facing the pill.
 */
export function DictationPillCardSurface({
  side,
  width: cardWidth,
  height: cardHeight,
}: {
  side: DictationPillSide;
  width: number;
  height: number;
}) {
  const { colors } = useTheme();
  const filterId = useId();
  const sideways = side === "left" || side === "right";
  const width = cardWidth + (sideways ? ARROW_DEPTH : 0);
  const height = cardHeight + (sideways ? 0 : ARROW_DEPTH);
  const path = surfacePath(side, cardWidth, cardHeight);

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={SURFACE_STYLE}
      pointerEvents="none"
      accessible={false}
    >
      <Defs>
        <Filter
          id={filterId}
          x={-12}
          y={-12}
          width={width + 24}
          height={height + 24}
          filterUnits="userSpaceOnUse"
        >
          <FeOffset in="SourceAlpha" dy={-4} />
          <FeGaussianBlur stdDeviation={6} result="shiftedBlur" />
          <FeComposite
            in="SourceAlpha"
            in2="shiftedBlur"
            operator="out"
            result="innerEdge"
          />
          <FeFlood floodColor={colors.dictationTalkTeaserHighlight} />
          <FeComposite in2="innerEdge" operator="in" />
          <FeBlend in2="SourceGraphic" />
        </Filter>
      </Defs>
      <Path
        d={path}
        fill={colors.dictationTalkTeaserSurface}
        filter={`url(#${filterId})`}
      />
      <Path
        d={path}
        fill="none"
        stroke={colors.dictationTalkTeaserBorder}
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function surfacePath(
  side: DictationPillSide,
  cardWidth: number,
  cardHeight: number,
): string {
  const left = (side === "left" ? ARROW_DEPTH : 0) + 0.5;
  const top = (side === "top" ? ARROW_DEPTH : 0) + 0.5;
  const right = left + cardWidth - 1;
  const bottom = top + cardHeight - 1;
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  const tip = ARROW_DEPTH - 1;
  const arrows: Record<DictationPillSide, string> = {
    top: `H${cx - HALF_ARROW} L${cx - 1} ${top - tip} Q${cx} ${top - ARROW_DEPTH} ${cx + 1} ${top - tip} L${cx + HALF_ARROW} ${top}`,
    right: `V${cy - HALF_ARROW} L${right + tip} ${cy - 1} Q${right + ARROW_DEPTH} ${cy} ${right + tip} ${cy + 1} L${right} ${cy + HALF_ARROW}`,
    bottom: `H${cx + HALF_ARROW} L${cx + 1} ${bottom + tip} Q${cx} ${bottom + ARROW_DEPTH} ${cx - 1} ${bottom + tip} L${cx - HALF_ARROW} ${bottom}`,
    left: `V${cy + HALF_ARROW} L${left - tip} ${cy + 1} Q${left - ARROW_DEPTH} ${cy} ${left - tip} ${cy - 1} L${left} ${cy - HALF_ARROW}`,
  };

  return [
    `M${left + RADIUS} ${top}`,
    side === "top" ? arrows.top : "",
    `H${right - RADIUS} A${RADIUS} ${RADIUS} 0 0 1 ${right} ${top + RADIUS}`,
    side === "right" ? arrows.right : "",
    `V${bottom - RADIUS} A${RADIUS} ${RADIUS} 0 0 1 ${right - RADIUS} ${bottom}`,
    side === "bottom" ? arrows.bottom : "",
    `H${left + RADIUS} A${RADIUS} ${RADIUS} 0 0 1 ${left} ${bottom - RADIUS}`,
    side === "left" ? arrows.left : "",
    `V${top + RADIUS} A${RADIUS} ${RADIUS} 0 0 1 ${left + RADIUS} ${top} Z`,
  ].join(" ");
}
