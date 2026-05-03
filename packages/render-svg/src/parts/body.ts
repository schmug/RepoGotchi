import type { PetVariation } from "@repogotchi/core";

export const BODY_CX = 200;
export const BODY_CY = 180;

/**
 * Renders the body silhouette. Radius is the existing `health → 80..120`
 * scale; each silhouette interprets it consistently so health affects size
 * the same way across variants.
 */
export function renderBody(
  silhouette: PetVariation["silhouette"],
  radius: number,
  fillUrl: string,
  outline: string,
): string {
  const r = num(radius);
  const ry = num(radius * 1.1);

  switch (silhouette) {
    case "round":
      return `<ellipse cx="${BODY_CX}" cy="${BODY_CY}" rx="${r}" ry="${ry}" fill="${fillUrl}" stroke="${outline}" stroke-width="3" vector-effect="non-scaling-stroke"/>`;

    case "teardrop": {
      // Narrower top, wider bottom. Path traced clockwise from top.
      const topY = BODY_CY - radius * 1.15;
      const leftX = BODY_CX - radius * 1.05;
      const rightX = BODY_CX + radius * 1.05;
      const bottomY = BODY_CY + radius * 1.15;
      const topCtrl = radius * 0.55;
      const top = num(topY);
      const left = num(leftX);
      const right = num(rightX);
      const bottom = num(bottomY);
      return `<path d="M ${BODY_CX} ${top}
        C ${num(BODY_CX - topCtrl)} ${top}
          ${left} ${num(BODY_CY - radius * 0.3)}
          ${left} ${num(BODY_CY + radius * 0.2)}
        C ${left} ${bottom}
          ${right} ${bottom}
          ${right} ${num(BODY_CY + radius * 0.2)}
        C ${right} ${num(BODY_CY - radius * 0.3)}
          ${num(BODY_CX + topCtrl)} ${top}
          ${BODY_CX} ${top} Z"
        fill="${fillUrl}" stroke="${outline}" stroke-width="3" vector-effect="non-scaling-stroke"/>`;
    }

    case "oval-wide":
      // Squashed and wider; rx grows, ry shrinks proportionally.
      return `<ellipse cx="${BODY_CX}" cy="${BODY_CY}" rx="${num(radius * 1.25)}" ry="${num(radius * 0.85)}" fill="${fillUrl}" stroke="${outline}" stroke-width="3" vector-effect="non-scaling-stroke"/>`;

    case "lumpy": {
      // Round body with two soft side bumps.
      const leftX = BODY_CX - radius;
      const rightX = BODY_CX + radius;
      const topY = BODY_CY - radius * 1.05;
      const bottomY = BODY_CY + radius * 1.05;
      const bumpOut = radius * 0.25;
      const left = num(leftX);
      const right = num(rightX);
      const top = num(topY);
      const bottom = num(bottomY);
      return `<path d="M ${BODY_CX} ${top}
        C ${num(BODY_CX - radius * 0.6)} ${top}
          ${num(leftX - bumpOut)} ${num(BODY_CY - radius * 0.3)}
          ${left} ${BODY_CY}
        C ${num(leftX - bumpOut)} ${num(BODY_CY + radius * 0.5)}
          ${num(BODY_CX - radius * 0.6)} ${bottom}
          ${BODY_CX} ${bottom}
        C ${num(BODY_CX + radius * 0.6)} ${bottom}
          ${num(rightX + bumpOut)} ${num(BODY_CY + radius * 0.5)}
          ${right} ${BODY_CY}
        C ${num(rightX + bumpOut)} ${num(BODY_CY - radius * 0.3)}
          ${num(BODY_CX + radius * 0.6)} ${top}
          ${BODY_CX} ${top} Z"
        fill="${fillUrl}" stroke="${outline}" stroke-width="3" vector-effect="non-scaling-stroke"/>`;
    }
  }
}

function num(x: number): string {
  return Number(x.toFixed(2)).toString();
}
