import { describe, expect, it } from "vitest";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PET_SCHEMA, STATE_SCHEMA } from "../src/index";
import type { Pet, State } from "../src/index";

const here = dirname(fileURLToPath(import.meta.url));

const ajv = new Ajv({ strict: true, allErrors: true });
addFormats(ajv);

const validatePet = ajv.compile<Pet>(PET_SCHEMA);
const validateState = ajv.compile<State>(STATE_SCHEMA);

async function loadFixture<T>(name: string): Promise<T> {
  const raw = await readFile(join(here, "fixtures", name), "utf8");
  return JSON.parse(raw) as T;
}

describe("pet schema", () => {
  it("accepts the example fixture and narrows to Pet", async () => {
    const json = await loadFixture<unknown>("pet.example.json");
    const ok = validatePet(json);
    if (!ok) throw new Error(JSON.stringify(validatePet.errors, null, 2));
    expect(ok).toBe(true);
    const pet = json satisfies Pet;
    expect(pet.schemaVersion).toBe(1);
    expect(pet.repo.owner).toBe("schmug");
  });

  it("rejects an invalid hex colour", async () => {
    const json = await loadFixture<Pet>("pet.example.json");
    json.palette.primary = "not-a-hex";
    expect(validatePet(json)).toBe(false);
  });

  it("rejects an unknown top-level field", async () => {
    const json = (await loadFixture<Pet>("pet.example.json")) as Pet & {
      mystery?: string;
    };
    json.mystery = "extra";
    expect(validatePet(json)).toBe(false);
  });
});

describe("state schema", () => {
  it("accepts the example fixture and narrows to State", async () => {
    const json = await loadFixture<unknown>("state.example.json");
    const ok = validateState(json);
    if (!ok) throw new Error(JSON.stringify(validateState.errors, null, 2));
    expect(ok).toBe(true);
    const state = json satisfies State;
    expect(state.scores.health).toBeGreaterThanOrEqual(0);
    expect(state.scores.health).toBeLessThanOrEqual(100);
  });

  it("rejects a score above 100", async () => {
    const json = await loadFixture<State>("state.example.json");
    json.scores.health = 101;
    expect(validateState(json)).toBe(false);
  });

  it("rejects an unknown mood", async () => {
    const json = await loadFixture<Record<string, unknown>>(
      "state.example.json",
    );
    json.mood = "sleepy-but-anxious";
    expect(validateState(json)).toBe(false);
  });
});
