import type { Pet, State } from "@repogotchi/contract";
import {
  computeScores,
  deriveHeadline,
  evolutionStageFor,
  levelFor,
  pickMood,
  type Signals,
} from "./scoring";

export {
  computeScores,
  deriveHeadline,
  evolutionStageFor,
  levelFor,
  pickMood,
} from "./scoring";
export type {
  EvolutionStage,
  Mood,
  Scores,
  Signals,
} from "./scoring";
export { petIdFor } from "./petId";
export type { RepoRef } from "./petId";
export { hatchPet } from "./hatch";
export type { HatchInput } from "./hatch";
export { derivePetVariation } from "./variation";
export type { PetVariation } from "./variation";

export interface ComposeStateInput {
  pet: Pet;
  signals: Signals;
  source: State["source"];
  /** Defaults to new Date().toISOString(). */
  computedAt?: string;
  /** Defaults to deriveHeadline(...). */
  statusHeadline?: string;
}

/**
 * One-shot scoring pipeline: signals → scores → mood → level → headline → State.
 * The returned State satisfies @repogotchi/contract's state.schema.json.
 */
export function composeState(input: ComposeStateInput): State {
  const scores = computeScores(input.signals);
  const mood = pickMood(scores, input.signals);
  const level = levelFor(input.signals);
  const evolutionStage = evolutionStageFor(level);
  const statusHeadline =
    input.statusHeadline ?? deriveHeadline(scores, input.signals, mood);

  return {
    schemaVersion: 1,
    petId: input.pet.id,
    computedAt: input.computedAt ?? new Date().toISOString(),
    scores,
    mood,
    level,
    evolutionStage,
    statusHeadline,
    signals: input.signals,
    source: input.source,
  };
}
