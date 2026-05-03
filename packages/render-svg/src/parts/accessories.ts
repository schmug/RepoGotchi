import type { Pet, State } from "@repogotchi/contract";
import { EYE_OFFSET, EYE_Y, FACE_CX } from "./eyes";

interface AccessoryFlags {
  crown: boolean;
  glasses: boolean;
  sparkles: boolean;
  zzz: boolean;
}

export function pickAccessories(pet: Pet, state: State): AccessoryFlags {
  const traits = new Set(pet.traits);
  const stars = state.signals.stars ?? 0;
  const contributors = state.signals.contributors ?? 0;
  const lastCommit = state.signals.lastCommitDaysAgo ?? Number.POSITIVE_INFINITY;

  return {
    crown: stars >= 100 || traits.has("popular"),
    glasses: contributors >= 5 || traits.has("scholarly"),
    sparkles: lastCommit <= 7 || traits.has("active"),
    zzz: state.mood === "sleepy" || lastCommit > 30,
  };
}

export function renderAccessories(pet: Pet, state: State): string {
  const flags = pickAccessories(pet, state);
  const accent = pet.palette.accent;
  const outline = pet.palette.outline;
  const parts: string[] = [];

  if (flags.crown) {
    parts.push(`
    <g aria-label="crown">
      <path d="M 150 80 L 160 100 L 170 85 L 180 100 L 190 85 L 200 100 L 210 85 L 220 100 L 230 85 L 240 100 L 250 80 L 150 80 Z"
            fill="${accent}" stroke="${outline}" stroke-width="2"/>
      <circle cx="165" cy="85" r="4" fill="#FF6B6B"/>
      <circle cx="200" cy="80" r="4" fill="#FF6B6B"/>
      <circle cx="235" cy="85" r="4" fill="#FF6B6B"/>
    </g>`);
  }

  if (flags.glasses) {
    parts.push(`
    <g aria-label="glasses" opacity="0.85">
      <circle cx="${FACE_CX - EYE_OFFSET}" cy="${EYE_Y}" r="20" fill="none" stroke="${outline}" stroke-width="2"/>
      <circle cx="${FACE_CX + EYE_OFFSET}" cy="${EYE_Y}" r="20" fill="none" stroke="${outline}" stroke-width="2"/>
      <line x1="${FACE_CX - EYE_OFFSET + 20}" y1="${EYE_Y}" x2="${FACE_CX + EYE_OFFSET - 20}" y2="${EYE_Y}" stroke="${outline}" stroke-width="2"/>
    </g>`);
  }

  if (flags.sparkles) {
    parts.push(`
    <g aria-label="sparkles">
      <path d="M 320 120 L 325 130 L 330 120 L 325 110 Z" fill="${accent}"/>
      <path d="M 70 120 L 75 130 L 80 120 L 75 110 Z" fill="${accent}"/>
      <path d="M 200 50 L 205 60 L 210 50 L 205 40 Z" fill="${accent}"/>
    </g>`);
  }

  if (flags.zzz) {
    parts.push(`
    <g aria-label="zzz" font-family="monospace" font-weight="bold" fill="${outline}">
      <text x="290" y="100" font-size="22">Z</text>
      <text x="310" y="80" font-size="16">z</text>
      <text x="325" y="65" font-size="12">z</text>
    </g>`);
  }

  return parts.join("");
}
