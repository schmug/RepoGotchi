import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Pet, State } from "@repogotchi/contract";
import { renderPet } from "../src/index";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "out");
await mkdir(outDir, { recursive: true });

const pet: Pet = {
  schemaVersion: 1,
  id: "a3f5b8c2d1e0",
  repo: { host: "github", owner: "schmug", name: "RepoGotchi" },
  name: "Stacky",
  species: "blob",
  palette: {
    primary: "#3178C6",
    secondary: "#1E4E8E",
    accent: "#FFD700",
    outline: "#1A1A1A",
  },
  personality: "Methodical and precise.",
  traits: [],
  bornAt: "2026-05-02T19:30:00Z",
  visualPrompt: null,
};

const variants: Array<{ filename: string; state: State }> = [
  {
    filename: "happy-popular.svg",
    state: stateOf({
      mood: "happy",
      signals: { stars: 250, contributors: 8, lastCommitDaysAgo: 1 },
    }),
  },
  {
    filename: "sad-stale.svg",
    state: stateOf({
      mood: "sad",
      scores: { health: 25, happiness: 20, energy: 15, cleanliness: 30 },
      signals: { lastCommitDaysAgo: 60 },
    }),
  },
  {
    filename: "sick-failing.svg",
    state: stateOf({
      mood: "sick",
      scores: { health: 30, happiness: 40, energy: 35, cleanliness: 25 },
      signals: { ciStatus: "failing" },
    }),
  },
  {
    filename: "ghost-archived.svg",
    state: stateOf({
      mood: "ghost",
      signals: { isArchived: true },
    }),
  },
];

for (const { filename, state } of variants) {
  const { svg } = renderPet(pet, state);
  const path = join(outDir, filename);
  await writeFile(path, svg);
  console.log(`wrote ${path}`);
}

function stateOf(overrides: Partial<State>): State {
  return {
    schemaVersion: 1,
    petId: pet.id,
    computedAt: "2026-05-02T19:32:00Z",
    scores: { health: 75, happiness: 65, energy: 50, cleanliness: 80 },
    mood: "happy",
    level: 5,
    evolutionStage: "juvenile",
    statusHeadline: "demo",
    signals: {},
    source: "manual",
    ...overrides,
  };
}
