import type { Pet } from "@repogotchi/contract";
import { petIdFor, type RepoRef } from "./petId";

export interface HatchInput extends RepoRef {
  /** Primary language reported by the host. Drives the palette. */
  language?: string | null;
  /**
   * Repo creation timestamp (ISO 8601). Stored as bornAt so the same repo
   * yields a byte-identical Pet across runs. Required for determinism.
   */
  createdAt: string;
}

// Curated short pet-friendly names. Indexed by petId hash.
const NAMES = [
  "Stacky", "Dewey", "Fireball", "Rocky", "Seedy",
  "Clippy", "Pixel", "Branchy", "Forky", "Merge",
  "Ditto", "Basic", "Casey", "Doc", "Echo",
  "Fizz", "Gizmo", "Hatch", "Kit", "Lint",
  "Mock", "Nibble", "Octi", "Patch", "Quark",
  "Ripple", "Slug", "Tide", "Unit", "Yarn",
  "Bagel", "Twig",
];

// Subset of GitHub language colors. Anything not listed falls back to the
// default. Source aligned with github/linguist's language list.
const LANGUAGE_COLOR: Record<string, string> = {
  JavaScript: "#F7DF1E",
  TypeScript: "#3178C6",
  Python: "#3776AB",
  Java: "#007396",
  Go: "#00ADD8",
  Rust: "#CE422B",
  Ruby: "#CC342D",
  PHP: "#777BB4",
  "C++": "#00599C",
  C: "#A8B9CC",
  "C#": "#239120",
  Swift: "#FA7343",
  Kotlin: "#7F52FF",
  Dart: "#0175C2",
  Shell: "#89E051",
  HTML: "#E34F26",
  CSS: "#1572B6",
  Vue: "#41B883",
  Elixir: "#6E4A7E",
  Haskell: "#5D4F85",
  Lua: "#000080",
  Zig: "#EC915C",
  Scala: "#C22D40",
  Clojure: "#DB5855",
  Elm: "#60B5CC",
  OCaml: "#3BE133",
};

const DEFAULT_PRIMARY = "#7C3AED";
const ACCENT = "#FFD700";
const OUTLINE = "#1A1A1A";

/**
 * Stateless pet identity generator. Same repo always produces the same Pet
 * (given the same createdAt). Used by the Worker and CLI to materialize a
 * pet without any storage.
 */
export async function hatchPet(input: HatchInput): Promise<Pet> {
  const id = await petIdFor(input);
  const nameIdx = parseInt(id.slice(0, 4), 16) % NAMES.length;
  const name = NAMES[nameIdx]!;
  const primary = LANGUAGE_COLOR[input.language ?? ""] ?? DEFAULT_PRIMARY;

  return {
    schemaVersion: 1,
    id,
    repo: { host: input.host, owner: input.owner, name: input.name },
    name,
    species: "blob",
    palette: {
      primary,
      secondary: darkenHex(primary, 0.4),
      accent: ACCENT,
      outline: OUTLINE,
    },
    personality: "",
    traits: [],
    bornAt: input.createdAt,
    visualPrompt: null,
  };
}

function darkenHex(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const dim = (c: number) => Math.max(0, Math.round(c * (1 - factor)));
  return (
    "#" +
    [dim(r), dim(g), dim(b)]
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}
