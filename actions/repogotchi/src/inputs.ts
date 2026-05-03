import * as core from "@actions/core";

export interface ActionInputs {
  commit: boolean;
  commitMessage: string;
  outputDir: string;
  githubToken: string;
}

export function readInputs(): ActionInputs {
  return {
    commit: core.getBooleanInput("commit"),
    commitMessage: core.getInput("commit-message") || "chore(repogotchi): refresh pet",
    outputDir: core.getInput("output-dir") || ".repogotchi",
    githubToken: core.getInput("github-token", { required: true }),
  };
}
