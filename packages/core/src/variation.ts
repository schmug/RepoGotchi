import type { Pet } from "@repogotchi/contract";

/**
 * Identity-derived visual variation. Pure function of pet.id; same pet always
 * produces the same variation. Lives next to hatchPet because variation is
 * part of identity, not state.
 *
 * Byte allocation in pet.id (12 hex chars = 6 bytes):
 *   bytes 0-1 (u16) → name index (existing, in hatch.ts)
 *   byte 2          → silhouette (% 4)
 *   byte 3          → earKind    (% 6)
 *   byte 4          → eyeKind    (% 4)
 *   byte 5 hi nib   → cheekKind  (% 3)
 *   byte 5 lo nib   → trinket    (% 6)
 *
 * Future dimensions: hash pet.id again with a salt prefix and read from that
 * hash. Do NOT silently reuse bit ranges already in this table.
 */
export interface PetVariation {
  silhouette: "round" | "teardrop" | "oval-wide" | "lumpy";
  earKind: "pointed-2" | "round-2" | "floppy-2" | "tuft-3" | "none" | "horn-2";
  eyeKind: "round" | "almond" | "bead" | "wide";
  cheekKind: "blush-pink" | "freckles" | "none";
  trinket: "collar" | "bowtie" | "belly-patch" | "tail-tuft" | "whisker-3" | "none";
}

const SILHOUETTES: PetVariation["silhouette"][] = [
  "round", "teardrop", "oval-wide", "lumpy",
];
const EAR_KINDS: PetVariation["earKind"][] = [
  "pointed-2", "round-2", "floppy-2", "tuft-3", "none", "horn-2",
];
const EYE_KINDS: PetVariation["eyeKind"][] = [
  "round", "almond", "bead", "wide",
];
const CHEEK_KINDS: PetVariation["cheekKind"][] = [
  "blush-pink", "freckles", "none",
];
const TRINKETS: PetVariation["trinket"][] = [
  "collar", "bowtie", "belly-patch", "tail-tuft", "whisker-3", "none",
];

export function derivePetVariation(pet: Pet): PetVariation {
  const b2 = readByte(pet.id, 2);
  const b3 = readByte(pet.id, 3);
  const b4 = readByte(pet.id, 4);
  const b5 = readByte(pet.id, 5);
  const b5hi = (b5 >> 4) & 0x0f;
  const b5lo = b5 & 0x0f;

  return {
    silhouette: SILHOUETTES[b2 % SILHOUETTES.length]!,
    earKind: EAR_KINDS[b3 % EAR_KINDS.length]!,
    eyeKind: EYE_KINDS[b4 % EYE_KINDS.length]!,
    cheekKind: CHEEK_KINDS[b5hi % CHEEK_KINDS.length]!,
    trinket: TRINKETS[b5lo % TRINKETS.length]!,
  };
}

function readByte(hex: string, index: number): number {
  const start = index * 2;
  const slice = hex.slice(start, start + 2);
  const n = parseInt(slice, 16);
  return Number.isFinite(n) ? n : 0;
}
