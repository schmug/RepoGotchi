import type { Pet } from "@repogotchi/contract";
import type { PetVariation } from "@repogotchi/core";
import { BODY_CX, BODY_CY } from "./body";

const CHEEK_Y = BODY_CY + 10;
const CHEEK_OFFSET = 80;

export function renderCheeks(
  cheekKind: PetVariation["cheekKind"],
  pet: Pet,
): string {
  switch (cheekKind) {
    case "blush-pink":
      return `
    <ellipse cx="${BODY_CX - CHEEK_OFFSET}" cy="${CHEEK_Y}" rx="14" ry="9" fill="var(--blush)" opacity="0.7"/>
    <ellipse cx="${BODY_CX + CHEEK_OFFSET}" cy="${CHEEK_Y}" rx="14" ry="9" fill="var(--blush)" opacity="0.7"/>`;

    case "freckles": {
      const accent = pet.palette.accent;
      return `
    <g opacity="0.7" fill="${accent}">
      <circle cx="${BODY_CX - CHEEK_OFFSET - 6}" cy="${CHEEK_Y - 4}" r="2"/>
      <circle cx="${BODY_CX - CHEEK_OFFSET + 2}" cy="${CHEEK_Y + 2}" r="2"/>
      <circle cx="${BODY_CX - CHEEK_OFFSET + 8}" cy="${CHEEK_Y - 2}" r="2"/>
      <circle cx="${BODY_CX + CHEEK_OFFSET - 8}" cy="${CHEEK_Y - 2}" r="2"/>
      <circle cx="${BODY_CX + CHEEK_OFFSET - 2}" cy="${CHEEK_Y + 2}" r="2"/>
      <circle cx="${BODY_CX + CHEEK_OFFSET + 6}" cy="${CHEEK_Y - 4}" r="2"/>
    </g>`;
    }

    case "none":
      return "";
  }
}
