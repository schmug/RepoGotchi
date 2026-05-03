import type { Pet, State } from "@repogotchi/contract";
import { petIdFor } from "@repogotchi/core";
import { getOrigin, type GitContext } from "../git";
import { petPaths } from "../paths";
import { readPet, readState } from "../storage";

export interface StatusDeps {
  home?: string;
}

export interface StatusResult {
  pet: Pet;
  state: State;
  paths: { pet: string; state: string; svg: string };
}

export async function status(
  ctx: GitContext,
  deps: StatusDeps = {},
): Promise<StatusResult> {
  const repo = getOrigin(ctx);
  const id = await petIdFor(repo);
  const paths = petPaths(id, deps.home);
  const pet = await readPet(paths);
  const state = await readState(paths);
  return {
    pet,
    state,
    paths: { pet: paths.pet, state: paths.state, svg: paths.svg },
  };
}
