import { homedir } from "node:os";
import { join } from "node:path";

export interface PetPaths {
  /** Directory holding pet.json, state.json, pet.svg. */
  base: string;
  pet: string;
  state: string;
  svg: string;
}

export function rootDir(home: string = homedir()): string {
  return join(home, ".repogotchi");
}

export function petsDir(home: string = homedir()): string {
  return join(rootDir(home), "pets");
}

export function petPaths(id: string, home: string = homedir()): PetPaths {
  const base = join(petsDir(home), id);
  return {
    base,
    pet: join(base, "pet.json"),
    state: join(base, "state.json"),
    svg: join(base, "pet.svg"),
  };
}
