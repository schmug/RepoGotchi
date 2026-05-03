import { describe, expect, it } from "vitest";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import type { Pet } from "@repogotchi/contract";
import { STATE_SCHEMA } from "@repogotchi/contract";
import { composeState } from "../src/index";

const ajv = new Ajv({ strict: true, allErrors: true });
addFormats(ajv);
const validateState = ajv.compile(STATE_SCHEMA);

const PET: Pet = {
  schemaVersion: 1,
  id: "a3f5b8c2d1e0",
  repo: { host: "github", owner: "schmug", name: "RepoGotchi" },
  name: "Stacky",
  species: "blob",
  palette: {
    primary: "#3178C6",
    secondary: "#1E4E8E",
    accent: "#FFD700",
    outline: "#1A1A1A",
  },
  personality: "Test pet.",
  traits: [],
  bornAt: "2026-05-02T00:00:00Z",
  visualPrompt: null,
};

describe("composeState", () => {
  it("produces a State that validates against the contract schema", () => {
    const state = composeState({
      pet: PET,
      signals: {
        ciStatus: "passing",
        contributors: 4,
        openPullRequests: 1,
        lastCommitDaysAgo: 1,
      },
      source: "cli",
      computedAt: "2026-05-02T19:30:00Z",
    });
    const ok = validateState(state);
    if (!ok) throw new Error(JSON.stringify(validateState.errors, null, 2));
    expect(ok).toBe(true);
    expect(state.petId).toBe(PET.id);
    expect(state.signals).toEqual({
      ciStatus: "passing",
      contributors: 4,
      openPullRequests: 1,
      lastCommitDaysAgo: 1,
    });
  });

  it("derives a sensible mood and headline for an archived repo", () => {
    const state = composeState({
      pet: PET,
      signals: { isArchived: true, lastCommitDaysAgo: 400 },
      source: "action",
      computedAt: "2026-05-02T19:30:00Z",
    });
    expect(state.mood).toBe("ghost");
    expect(state.statusHeadline.toLowerCase()).toContain("archive");
    expect(validateState(state)).toBe(true);
  });

  it("uses now() for computedAt when omitted", () => {
    const before = Date.now();
    const state = composeState({
      pet: PET,
      signals: {},
      source: "manual",
    });
    const ts = Date.parse(state.computedAt);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it("respects a caller-supplied headline", () => {
    const state = composeState({
      pet: PET,
      signals: {},
      source: "manual",
      statusHeadline: "Custom headline",
    });
    expect(state.statusHeadline).toBe("Custom headline");
  });
});
