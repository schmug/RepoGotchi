import type { Pet, State } from "@repogotchi/contract";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { PetPaths } from "./paths";

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, JSON.stringify(value, null, 2) + "\n", "utf8");
}

export async function writePet(paths: PetPaths, pet: Pet): Promise<void> {
  await mkdir(paths.base, { recursive: true });
  await writeJson(paths.pet, pet);
}

export async function writeState(paths: PetPaths, state: State): Promise<void> {
  await mkdir(paths.base, { recursive: true });
  await writeJson(paths.state, state);
}

export async function writeSvg(paths: PetPaths, svg: string): Promise<void> {
  await mkdir(paths.base, { recursive: true });
  await writeFile(paths.svg, svg, "utf8");
}

export async function readPet(paths: PetPaths): Promise<Pet> {
  return JSON.parse(await readFile(paths.pet, "utf8")) as Pet;
}

export async function readState(paths: PetPaths): Promise<State> {
  return JSON.parse(await readFile(paths.state, "utf8")) as State;
}
