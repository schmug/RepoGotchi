import * as core from "@actions/core";
import * as github from "@actions/github";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Pet } from "@repogotchi/contract";
import { composeState, hatchPet } from "@repogotchi/core";
import { renderPet } from "@repogotchi/render-svg";
import { commitAndPush, configureIdentity, workingTreeIsClean } from "./git";
import { fetchRepoFacts } from "./octokit";
import { readInputs } from "./inputs";

export async function run(): Promise<void> {
  try {
    const inputs = readInputs();
    const { owner, repo: name } = github.context.repo;
    const facts = await fetchRepoFacts(inputs.githubToken);

    const repo = { host: "github" as const, owner, name };
    const petPath = join(inputs.outputDir, "pet.json");
    const statePath = join(inputs.outputDir, "state.json");
    const svgPath = join(inputs.outputDir, "pet.svg");

    await mkdir(inputs.outputDir, { recursive: true });

    const pet: Pet = existsSync(petPath)
      ? (JSON.parse(await readFile(petPath, "utf8")) as Pet)
      : await hatchPet({ ...repo, language: facts.language, createdAt: facts.createdAt });

    if (!existsSync(petPath)) {
      await writeFile(petPath, JSON.stringify(pet, null, 2) + "\n", "utf8");
    }

    const state = composeState({
      pet,
      signals: facts.signals,
      source: "action",
    });
    await writeFile(statePath, JSON.stringify(state, null, 2) + "\n", "utf8");

    const { svg } = renderPet(pet, state);
    await writeFile(svgPath, svg, "utf8");

    core.setOutput("pet-id", pet.id);
    core.setOutput("pet-name", pet.name);
    core.setOutput("status-headline", state.statusHeadline);

    if (inputs.commit) {
      await configureIdentity();
      const clean = await workingTreeIsClean([petPath, statePath, svgPath]);
      if (clean) {
        core.info("Pet files unchanged; nothing to commit.");
        core.setOutput("changed", "false");
      } else {
        await commitAndPush(
          [petPath, statePath, svgPath],
          inputs.commitMessage,
        );
        core.info(`Committed pet refresh: ${state.statusHeadline}`);
        core.setOutput("changed", "true");
      }
    } else {
      core.setOutput("changed", "false");
      core.info(`Pet rendered to ${svgPath} (commit disabled).`);
    }
  } catch (err) {
    core.setFailed((err as Error).message);
  }
}

