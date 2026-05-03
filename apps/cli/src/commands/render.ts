import { petIdFor } from "@repogotchi/core";
import { renderPet } from "@repogotchi/render-svg";
import { getOrigin, type GitContext } from "../git";
import { petPaths } from "../paths";
import { readPet, readState, writeSvg } from "../storage";

export interface RenderDeps {
  home?: string;
}

export interface RenderResult {
  svgPath: string;
}

export async function render(
  ctx: GitContext,
  deps: RenderDeps = {},
): Promise<RenderResult> {
  const repo = getOrigin(ctx);
  const id = await petIdFor(repo);
  const paths = petPaths(id, deps.home);
  const pet = await readPet(paths);
  const state = await readState(paths);
  const { svg } = renderPet(pet, state);
  await writeSvg(paths, svg);
  return { svgPath: paths.svg };
}
