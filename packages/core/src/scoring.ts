import type { State } from "@repogotchi/contract";

export type Signals = State["signals"];
export type Scores = State["scores"];
export type Mood = State["mood"];
export type EvolutionStage = State["evolutionStage"];

const HEALTH_BASE = 70;
const HAPPINESS_BASE = 60;

export function computeScores(signals: Signals): Scores {
  const health = clamp(
    HEALTH_BASE +
      ciHealthDelta(signals.ciStatus) +
      testHealthDelta(signals.testStatus) +
      (signals.hasUncommittedChanges ? -5 : 0),
  );

  let happiness = HAPPINESS_BASE;
  const contributors = signals.contributors ?? 0;
  if (contributors >= 10) happiness += 15;
  else if (contributors >= 5) happiness += 10;
  else if (contributors === 1) happiness -= 10;

  const issues = signals.openIssues ?? 0;
  const prs = signals.openPullRequests ?? 0;
  if (issues > Math.max(5, prs * 5)) happiness -= 15;
  if (prs > 0 && contributors >= 2) happiness += 10;
  if ((signals.stars ?? 0) >= 100) happiness += 10;
  if (signals.isArchived) happiness -= 50;

  const energy = energyFromRecency(signals);

  // Cleanliness mirrors health for v0; CLI lint signals will diverge it later.
  const cleanliness = health;

  return {
    health,
    happiness: clamp(happiness),
    energy,
    cleanliness,
  };
}

function ciHealthDelta(ci: Signals["ciStatus"]): number {
  switch (ci) {
    case "passing":
      return 15;
    case "failing":
      return -40;
    case "pending":
    case "unknown":
    case undefined:
      return 0;
  }
}

function testHealthDelta(t: Signals["testStatus"]): number {
  switch (t) {
    case "passing":
      return 10;
    case "failing":
      return -25;
    case "unknown":
    case undefined:
      return 0;
  }
}

function energyFromRecency(signals: Signals): number {
  if (signals.isArchived) return 5;
  const days = signals.lastCommitDaysAgo;
  if (days === undefined) return 50;
  if (days <= 1) return 95;
  if (days <= 7) return 80;
  if (days <= 30) return 50;
  if (days <= 90) return 25;
  return 10;
}

export function pickMood(scores: Scores, signals: Signals): Mood {
  if (signals.isArchived) return "ghost";
  if (
    signals.ciStatus === "failing" ||
    signals.testStatus === "failing" ||
    scores.health < 30
  ) {
    return "sick";
  }
  const issues = signals.openIssues ?? 0;
  const contributors = signals.contributors ?? 0;
  if (issues > 30 && contributors < 3) return "angry";
  if (scores.happiness < 30) return "sad";
  if (scores.energy >= 80 && scores.happiness >= 75) return "excited";
  if (scores.energy < 20) return "sleepy";
  if (scores.happiness >= 55 && scores.health >= 55) return "happy";
  return "sleepy";
}

export function levelFor(signals: Signals): number {
  return Math.max(1, Math.floor((signals.contributors ?? 0) / 2) + 1);
}

export function evolutionStageFor(level: number): EvolutionStage {
  if (level < 2) return "egg";
  if (level < 5) return "hatchling";
  if (level < 10) return "juvenile";
  if (level < 20) return "adult";
  if (level < 50) return "elder";
  return "ancient";
}

export function deriveHeadline(
  scores: Scores,
  signals: Signals,
  mood: Mood,
): string {
  if (signals.isArchived) return "Drifting through the archive";
  switch (mood) {
    case "sick":
      return "Build is in trouble";
    case "angry":
      return "Overwhelmed by open issues";
    case "sad":
      return "Could use some attention";
    case "excited":
      return "On fire — shipping clean code";
    case "happy":
      return "Healthy and active";
    case "ghost":
      return "Drifting through the archive";
    case "sleepy":
      return (signals.lastCommitDaysAgo ?? 0) > 30
        ? "Idle for weeks"
        : "Catching its breath";
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
