export type { Pet } from "../generated/ts/pet";
export type { State } from "../generated/ts/state";

import petSchema from "../schemas/pet.schema.json" with { type: "json" };
import stateSchema from "../schemas/state.schema.json" with { type: "json" };

export const PET_SCHEMA = petSchema;
export const STATE_SCHEMA = stateSchema;

export const SCHEMA_VERSION = 1 as const;
