import type { Pet } from "@repogotchi/contract";
import type { PetVariation } from "@repogotchi/core";
import { BODY_CX, BODY_CY } from "./body";

export function renderTrinket(
  trinket: PetVariation["trinket"],
  pet: Pet,
): string {
  const accent = pet.palette.accent;
  const outline = pet.palette.outline;

  switch (trinket) {
    case "collar":
      return `
    <g aria-label="collar">
      <path d="M ${BODY_CX - 70} ${BODY_CY + 60} Q ${BODY_CX} ${BODY_CY + 78} ${BODY_CX + 70} ${BODY_CY + 60}" stroke="${accent}" stroke-width="6" fill="none" stroke-linecap="round"/>
      <circle cx="${BODY_CX}" cy="${BODY_CY + 78}" r="5" fill="${accent}" stroke="${outline}" stroke-width="1.5"/>
    </g>`;

    case "bowtie":
      return `
    <g aria-label="bowtie">
      <path d="M ${BODY_CX - 22} ${BODY_CY + 70} L ${BODY_CX - 6} ${BODY_CY + 64} L ${BODY_CX - 6} ${BODY_CY + 80} Z" fill="${accent}" stroke="${outline}" stroke-width="1.5"/>
      <path d="M ${BODY_CX + 22} ${BODY_CY + 70} L ${BODY_CX + 6} ${BODY_CY + 64} L ${BODY_CX + 6} ${BODY_CY + 80} Z" fill="${accent}" stroke="${outline}" stroke-width="1.5"/>
      <rect x="${BODY_CX - 6}" y="${BODY_CY + 66}" width="12" height="12" rx="2" fill="${accent}" stroke="${outline}" stroke-width="1.5"/>
    </g>`;

    case "belly-patch":
      return `<ellipse aria-label="belly-patch" cx="${BODY_CX}" cy="${BODY_CY + 30}" rx="34" ry="22" fill="white" opacity="0.35"/>`;

    case "tail-tuft":
      return `
    <g aria-label="tail-tuft">
      <path d="M ${BODY_CX + 95} ${BODY_CY + 45} Q ${BODY_CX + 120} ${BODY_CY + 30} ${BODY_CX + 130} ${BODY_CY + 50} Q ${BODY_CX + 120} ${BODY_CY + 60} ${BODY_CX + 95} ${BODY_CY + 45} Z" fill="${pet.palette.secondary}" stroke="${outline}" stroke-width="2"/>
    </g>`;

    case "whisker-3":
      return `
    <g aria-label="whisker-3" stroke="${outline}" stroke-width="1.5" stroke-linecap="round">
      <line x1="${BODY_CX - 90}" y1="${BODY_CY - 5}" x2="${BODY_CX - 60}" y2="${BODY_CY - 8}"/>
      <line x1="${BODY_CX - 92}" y1="${BODY_CY + 5}" x2="${BODY_CX - 60}" y2="${BODY_CY + 4}"/>
      <line x1="${BODY_CX - 88}" y1="${BODY_CY + 14}" x2="${BODY_CX - 60}" y2="${BODY_CY + 14}"/>
      <line x1="${BODY_CX + 60}" y1="${BODY_CY - 8}" x2="${BODY_CX + 90}" y2="${BODY_CY - 5}"/>
      <line x1="${BODY_CX + 60}" y1="${BODY_CY + 4}" x2="${BODY_CX + 92}" y2="${BODY_CY + 5}"/>
      <line x1="${BODY_CX + 60}" y1="${BODY_CY + 14}" x2="${BODY_CX + 88}" y2="${BODY_CY + 14}"/>
    </g>`;

    case "none":
      return "";
  }
}
