/* eslint-disable */
/* AUTO-GENERATED — do not edit. Run `pnpm --filter @repogotchi/contract codegen` to regenerate. */

export type Score = number;

/**
 * Live mood and score snapshot for a pet, recomputed from repo signals.
 */
export interface State {
  schemaVersion: 1;
  petId: string;
  computedAt: string;
  scores: {
    health: Score;
    happiness: Score;
    energy: Score;
    cleanliness: Score;
  };
  mood: "happy" | "sad" | "sick" | "angry" | "sleepy" | "excited" | "ghost";
  level: number;
  evolutionStage: "egg" | "hatchling" | "juvenile" | "adult" | "elder" | "ancient";
  /**
   * Short human-readable status, e.g. 'Drowning in lint errors'.
   */
  statusHeadline: string;
  /**
   * Raw observations from the source. All optional; surfaces report what they can see.
   */
  signals: {
    lastCommitDaysAgo?: number;
    openIssues?: number;
    openPullRequests?: number;
    contributors?: number;
    stars?: number;
    isArchived?: boolean;
    ciStatus?: "passing" | "failing" | "pending" | "unknown";
    hasUncommittedChanges?: boolean;
    testStatus?: "passing" | "failing" | "unknown";
  };
  source: "cli" | "action" | "worker" | "manual";
}
