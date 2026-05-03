import { access } from "node:fs/promises";
import { composeState, hatchPet } from "@repogotchi/core";
import { renderPet } from "@repogotchi/render-svg";
import {
  getCreatedAt,
  getOrigin,
  readSignals,
  type GitContext,
} from "../git";
import { petPaths } from "../paths";
import { readPet, writePet, writeState, writeSvg } from "../storage";

export interface InitDeps {
  home?: string;
  now?: () => Date;
}

export interface InitResult {
  petId: string;
  petName: string;
  reused: boolean;
  paths: { pet: string; state: string; svg: string };
}

export async function init(
  ctx: GitContext,
  deps: InitDeps = {},
): Promise<InitResult> {
  const repo = getOrigin(ctx);
  const createdAt = getCreatedAt(ctx);
  const newPet = await hatchPet({ ...repo, createdAt });
  const paths = petPaths(newPet.id, deps.home);

  // Identity is meant to be stable; never overwrite an existing pet.json.
  let reused = false;
  try {
    await access(paths.pet);
    reused = true;
  } catch {
    await writePet(paths, newPet);
  }

  const pet = reused ? await readPet(paths) : newPet;

  const now = deps.now?.();
  const state = composeState({
    pet,
    signals: readSignals(ctx, now),
    source: "cli",
    ...(now ? { computedAt: now.toISOString() } : {}),
  });
  await writeState(paths, state);

  const { svg } = renderPet(pet, state);
  await writeSvg(paths, svg);

  return {
    petId: pet.id,
    petName: pet.name,
    reused,
    paths: { pet: paths.pet, state: paths.state, svg: paths.svg },
  };
}
