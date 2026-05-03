import type { Pet } from "@repogotchi/contract";
import type { PetVariation } from "@repogotchi/core";
import { BODY_CX } from "./body";

const EAR_LX = BODY_CX - 60;
const EAR_RX = BODY_CX + 60;
const EAR_TOP_Y = 120;

export function renderEars(
  earKind: PetVariation["earKind"],
  pet: Pet,
  outline: string,
  detail: "full" | "compact",
): string {
  const fill = pet.palette.primary;
  const accent = pet.palette.accent;

  if (detail === "compact") {
    switch (earKind) {
      case "none":
        return `
    <circle cx="${BODY_CX}" cy="80" r="3" fill="${outline}"/>`;
      case "horn-2":
        return `
    <path d="M ${EAR_LX - 6} ${EAR_TOP_Y - 5} L ${EAR_LX} ${EAR_TOP_Y - 30} L ${EAR_LX + 6} ${EAR_TOP_Y - 5} Z" fill="${accent}"/>
    <path d="M ${EAR_RX - 6} ${EAR_TOP_Y - 5} L ${EAR_RX} ${EAR_TOP_Y - 30} L ${EAR_RX + 6} ${EAR_TOP_Y - 5} Z" fill="${accent}"/>`;
      default:
        // pointed-2 / round-2 / floppy-2 / tuft-3 → simple round dots
        return `
    <circle cx="${EAR_LX}" cy="${EAR_TOP_Y}" r="22" fill="${fill}"/>
    <circle cx="${EAR_RX}" cy="${EAR_TOP_Y}" r="22" fill="${fill}"/>`;
    }
  }

  switch (earKind) {
    case "pointed-2":
      return `
    <ellipse cx="${EAR_LX}" cy="${EAR_TOP_Y}" rx="25" ry="35" fill="${fill}" stroke="${outline}" stroke-width="2"/>
    <ellipse cx="${EAR_RX}" cy="${EAR_TOP_Y}" rx="25" ry="35" fill="${fill}" stroke="${outline}" stroke-width="2"/>`;

    case "round-2":
      return `
    <circle cx="${EAR_LX}" cy="${EAR_TOP_Y}" r="28" fill="${fill}" stroke="${outline}" stroke-width="2"/>
    <circle cx="${EAR_RX}" cy="${EAR_TOP_Y}" r="28" fill="${fill}" stroke="${outline}" stroke-width="2"/>`;

    case "floppy-2":
      return `
    <path d="M ${EAR_LX - 18} ${EAR_TOP_Y - 10} Q ${EAR_LX - 28} ${EAR_TOP_Y + 30} ${EAR_LX} ${EAR_TOP_Y + 38} Q ${EAR_LX + 14} ${EAR_TOP_Y + 10} ${EAR_LX - 18} ${EAR_TOP_Y - 10} Z" fill="${fill}" stroke="${outline}" stroke-width="2"/>
    <path d="M ${EAR_RX + 18} ${EAR_TOP_Y - 10} Q ${EAR_RX + 28} ${EAR_TOP_Y + 30} ${EAR_RX} ${EAR_TOP_Y + 38} Q ${EAR_RX - 14} ${EAR_TOP_Y + 10} ${EAR_RX + 18} ${EAR_TOP_Y - 10} Z" fill="${fill}" stroke="${outline}" stroke-width="2"/>`;

    case "tuft-3":
      return `
    <path d="M ${BODY_CX - 30} 90 L ${BODY_CX - 18} 70 L ${BODY_CX - 6} 90 Z" fill="${fill}" stroke="${outline}" stroke-width="2"/>
    <path d="M ${BODY_CX - 8} 85 L ${BODY_CX} 60 L ${BODY_CX + 8} 85 Z" fill="${fill}" stroke="${outline}" stroke-width="2"/>
    <path d="M ${BODY_CX + 6} 90 L ${BODY_CX + 18} 70 L ${BODY_CX + 30} 90 Z" fill="${fill}" stroke="${outline}" stroke-width="2"/>`;

    case "none":
      return `
    <circle cx="${BODY_CX}" cy="80" r="3" fill="${outline}"/>
    <line x1="${BODY_CX}" y1="80" x2="${BODY_CX}" y2="95" stroke="${outline}" stroke-width="2"/>`;

    case "horn-2":
      return `
    <path d="M ${EAR_LX - 8} ${EAR_TOP_Y - 5} L ${EAR_LX} ${EAR_TOP_Y - 38} L ${EAR_LX + 8} ${EAR_TOP_Y - 5} Z" fill="${accent}" stroke="${outline}" stroke-width="2"/>
    <path d="M ${EAR_RX - 8} ${EAR_TOP_Y - 5} L ${EAR_RX} ${EAR_TOP_Y - 38} L ${EAR_RX + 8} ${EAR_TOP_Y - 5} Z" fill="${accent}" stroke="${outline}" stroke-width="2"/>`;
  }
}
