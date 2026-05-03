import { composeState, petIdFor } from "@repogotchi/core";
import { renderPet } from "@repogotchi/render-svg";
import { getOrigin, readSignals, type GitContext } from "../git";
import { petPaths } from "../paths";
import { readPet, writeState, writeSvg } from "../storage";

export interface ComputeDeps {
  home?: string;
  now?: () => Date;
}

export interface ComputeResult {
  petId: string;
  mood: string;
  statusHeadline: string;
  paths: { state: string; svg: string };
}

export async function compute(
  ctx: GitContext,
  deps: ComputeDeps = {},
): Promise<ComputeResult> {
  const repo = getOrigin(ctx);
  const id = await petIdFor(repo);
  const paths = petPaths(id, deps.home);

  const pet = await readPet(paths);
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
    petId: id,
    mood: state.mood,
    statusHeadline: state.statusHeadline,
    paths: { state: paths.state, svg: paths.svg },
  };
}
