import { describe, expect, it } from "vitest";
import {
  computeScores,
  deriveHeadline,
  evolutionStageFor,
  levelFor,
  pickMood,
  type Signals,
} from "../src/scoring";

function s(overrides: Partial<Signals> = {}): Signals {
  return { ...overrides };
}

describe("computeScores", () => {
  it("returns the four score axes in [0, 100]", () => {
    const out = computeScores(s({ ciStatus: "passing" }));
    for (const v of Object.values(out)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it("rewards passing CI and tests", () => {
    const passing = computeScores(
      s({ ciStatus: "passing", testStatus: "passing" }),
    );
    const failing = computeScores(
      s({ ciStatus: "failing", testStatus: "failing" }),
    );
    expect(passing.health).toBeGreaterThan(failing.health);
    expect(failing.health).toBeLessThan(40);
  });

  it("punishes archived repos with rock-bottom energy and happiness", () => {
    const out = computeScores(s({ isArchived: true }));
    expect(out.energy).toBeLessThan(20);
    expect(out.happiness).toBeLessThan(20);
  });

  it("scales energy by recency", () => {
    expect(computeScores(s({ lastCommitDaysAgo: 0 })).energy).toBeGreaterThan(
      90,
    );
    expect(computeScores(s({ lastCommitDaysAgo: 5 })).energy).toBeGreaterThan(
      70,
    );
    expect(computeScores(s({ lastCommitDaysAgo: 60 })).energy).toBeLessThan(40);
    expect(computeScores(s({ lastCommitDaysAgo: 365 })).energy).toBeLessThan(
      20,
    );
  });

  it("rewards healthy collaboration", () => {
    const lonely = computeScores(s({ contributors: 1 }));
    const teamed = computeScores(s({ contributors: 12, openPullRequests: 3 }));
    expect(teamed.happiness).toBeGreaterThan(lonely.happiness);
  });
});

describe("pickMood", () => {
  it("returns ghost for archived repos no matter the scores", () => {
    const scores = computeScores(s({ isArchived: false }));
    expect(pickMood(scores, { isArchived: true })).toBe("ghost");
  });

  it("returns sick when CI is failing", () => {
    const sig = s({ ciStatus: "failing" });
    expect(pickMood(computeScores(sig), sig)).toBe("sick");
  });

  it("returns angry when issues pile up without contributors", () => {
    const sig = s({ openIssues: 50, contributors: 1 });
    expect(pickMood(computeScores(sig), sig)).toBe("angry");
  });

  it("returns excited when energy and happiness are both high", () => {
    const sig = s({
      ciStatus: "passing",
      lastCommitDaysAgo: 0,
      contributors: 12,
      openPullRequests: 3,
      stars: 500,
    });
    expect(pickMood(computeScores(sig), sig)).toBe("excited");
  });

  it("returns happy in the steady-state middle", () => {
    const sig = s({
      ciStatus: "passing",
      lastCommitDaysAgo: 5,
      contributors: 4,
      openPullRequests: 1,
    });
    expect(pickMood(computeScores(sig), sig)).toBe("happy");
  });

  it("returns sleepy for stale repos with no other signal", () => {
    const sig = s({ lastCommitDaysAgo: 200 });
    expect(pickMood(computeScores(sig), sig)).toBe("sleepy");
  });
});

describe("levelFor / evolutionStageFor", () => {
  it("scales level with contributors and floors at 1", () => {
    expect(levelFor({})).toBe(1);
    expect(levelFor({ contributors: 0 })).toBe(1);
    expect(levelFor({ contributors: 4 })).toBe(3);
    expect(levelFor({ contributors: 100 })).toBe(51);
  });

  it("maps level to evolution stage at the documented thresholds", () => {
    expect(evolutionStageFor(1)).toBe("egg");
    expect(evolutionStageFor(2)).toBe("hatchling");
    expect(evolutionStageFor(5)).toBe("juvenile");
    expect(evolutionStageFor(10)).toBe("adult");
    expect(evolutionStageFor(20)).toBe("elder");
    expect(evolutionStageFor(50)).toBe("ancient");
    expect(evolutionStageFor(999)).toBe("ancient");
  });
});

describe("deriveHeadline", () => {
  it("produces a non-empty string for every mood", () => {
    const sig = s();
    const scores = computeScores(sig);
    for (const mood of [
      "happy",
      "sad",
      "sick",
      "angry",
      "sleepy",
      "excited",
      "ghost",
    ] as const) {
      const h = deriveHeadline(scores, sig, mood);
      expect(h.length).toBeGreaterThan(0);
      expect(h.length).toBeLessThanOrEqual(120);
    }
  });

  it("overrides with archive copy regardless of mood", () => {
    const h = deriveHeadline(
      computeScores(s({ isArchived: true })),
      s({ isArchived: true }),
      "happy",
    );
    expect(h.toLowerCase()).toContain("archive");
  });
});
