import { describe, expect, it } from "vitest";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { PET_SCHEMA } from "@repogotchi/contract";
import { hatchPet } from "../src/hatch";

const ajv = new Ajv({ strict: true, allErrors: true });
addFormats(ajv);
const validatePet = ajv.compile(PET_SCHEMA);

const BORN = "2026-05-02T00:00:00Z";

describe("hatchPet", () => {
  it("produces a Pet that validates against the contract schema", async () => {
    const pet = await hatchPet({
      host: "github",
      owner: "schmug",
      name: "RepoGotchi",
      language: "TypeScript",
      createdAt: BORN,
    });
    const ok = validatePet(pet);
    if (!ok) throw new Error(JSON.stringify(validatePet.errors, null, 2));
    expect(ok).toBe(true);
    expect(pet.id).toMatch(/^[a-f0-9]{12}$/);
    expect(pet.bornAt).toBe(BORN);
  });

  it("is deterministic across calls", async () => {
    const a = await hatchPet({
      host: "github",
      owner: "schmug",
      name: "RepoGotchi",
      language: "TypeScript",
      createdAt: BORN,
    });
    const b = await hatchPet({
      host: "github",
      owner: "schmug",
      name: "RepoGotchi",
      language: "TypeScript",
      createdAt: BORN,
    });
    expect(a).toEqual(b);
  });

  it("uses the language palette when known", async () => {
    const pet = await hatchPet({
      host: "github",
      owner: "schmug",
      name: "RepoGotchi",
      language: "TypeScript",
      createdAt: BORN,
    });
    expect(pet.palette.primary).toBe("#3178C6");
    expect(pet.palette.outline).toBe("#1A1A1A");
    expect(pet.palette.accent).toBe("#FFD700");
  });

  it("falls back to the default palette for unknown languages", async () => {
    const pet = await hatchPet({
      host: "github",
      owner: "schmug",
      name: "RepoGotchi",
      language: "Brainfuck",
      createdAt: BORN,
    });
    expect(pet.palette.primary).toBe("#7C3AED");
  });

  it("falls back to the default palette when language is null", async () => {
    const pet = await hatchPet({
      host: "github",
      owner: "schmug",
      name: "RepoGotchi",
      language: null,
      createdAt: BORN,
    });
    expect(pet.palette.primary).toBe("#7C3AED");
  });

  it("derives a darker secondary palette from primary", async () => {
    const pet = await hatchPet({
      host: "github",
      owner: "schmug",
      name: "RepoGotchi",
      language: "TypeScript",
      createdAt: BORN,
    });
    // Primary #3178C6, factor 0.4 -> roughly 60% of each channel.
    expect(pet.palette.secondary).toBe("#1D4877");
  });

  it("picks names deterministically from the curated pool", async () => {
    const a = await hatchPet({
      host: "github",
      owner: "schmug",
      name: "RepoGotchi",
      createdAt: BORN,
    });
    const b = await hatchPet({
      host: "github",
      owner: "schmug",
      name: "contextbuddy",
      createdAt: BORN,
    });
    expect(a.name).toMatch(/^[A-Z][a-z]+$/);
    expect(b.name).toMatch(/^[A-Z][a-z]+$/);
    // Different repos pick different names with very high probability;
    // assert that the same input is stable across calls.
    const aAgain = await hatchPet({
      host: "github",
      owner: "schmug",
      name: "RepoGotchi",
      createdAt: BORN,
    });
    expect(a.name).toBe(aAgain.name);
  });
});
