import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { init } from "../../src/commands/init";
import { compute } from "../../src/commands/compute";
import { status } from "../../src/commands/status";
import {
  makeTempHome,
  makeTempRepo,
  type TempRepo,
} from "../helpers/tempRepo";

describe("init + compute + status (integration)", () => {
  let repo: TempRepo;
  let home: { home: string; cleanup: () => void };

  beforeEach(() => {
    repo = makeTempRepo();
    home = makeTempHome();
  });

  afterEach(() => {
    repo.cleanup();
    home.cleanup();
  });

  it("hatches a pet, writes pet.json + state.json + pet.svg", async () => {
    const res = await init({ cwd: repo.path }, { home: home.home });

    expect(res.reused).toBe(false);
    expect(res.petId).toMatch(/^[a-f0-9]{12}$/);

    const pet = JSON.parse(await readFile(res.paths.pet, "utf8"));
    const state = JSON.parse(await readFile(res.paths.state, "utf8"));
    const svg = await readFile(res.paths.svg, "utf8");

    expect(svg.startsWith("<?xml")).toBe(true);
    expect(state.source).toBe("cli");
    expect(state.petId).toBe(res.petId);
    expect(pet.repo.owner).toBe("schmug");
    expect(pet.repo.name).toBe("RepoGotchi");
  });

  it("reuses pet.json on second init (identity is stable)", async () => {
    const a = await init({ cwd: repo.path }, { home: home.home });
    const petA = await readFile(a.paths.pet, "utf8");

    const b = await init({ cwd: repo.path }, { home: home.home });
    expect(b.reused).toBe(true);
    expect(b.petId).toBe(a.petId);

    const petB = await readFile(a.paths.pet, "utf8");
    expect(petB).toBe(petA);
  });

  it("compute updates state.json and pet.svg without touching pet.json", async () => {
    const before = await init({ cwd: repo.path }, { home: home.home });
    const petBefore = await readFile(before.paths.pet, "utf8");

    const r = await compute({ cwd: repo.path }, { home: home.home });
    expect(r.petId).toBe(before.petId);

    const petAfter = await readFile(before.paths.pet, "utf8");
    expect(petAfter).toBe(petBefore);
  });

  it("status reads back pet + state from disk", async () => {
    await init({ cwd: repo.path }, { home: home.home });
    const r = await status({ cwd: repo.path }, { home: home.home });
    expect(r.pet.id).toMatch(/^[a-f0-9]{12}$/);
    expect(r.pet.repo.owner).toBe("schmug");
    expect(typeof r.state.statusHeadline).toBe("string");
  });
});
