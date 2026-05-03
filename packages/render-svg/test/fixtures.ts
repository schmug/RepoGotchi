import type { Pet, State } from "@repogotchi/contract";

export const PET: Pet = {
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

export function makeState(overrides: Partial<State> = {}): State {
  return {
    schemaVersion: 1,
    petId: PET.id,
    computedAt: "2026-05-02T19:32:00Z",
    scores: { health: 75, happiness: 65, energy: 50, cleanliness: 80 },
    mood: "happy",
    level: 5,
    evolutionStage: "juvenile",
    statusHeadline: "Steady commits, green CI",
    signals: {
      lastCommitDaysAgo: 1,
      openIssues: 3,
      openPullRequests: 1,
      contributors: 4,
      stars: 12,
      isArchived: false,
      ciStatus: "passing",
    },
    source: "cli",
    ...overrides,
  };
}
