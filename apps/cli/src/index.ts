#!/usr/bin/env node
import { parseArgs } from "node:util";
import { compute } from "./commands/compute";
import { init } from "./commands/init";
import { render } from "./commands/render";
import { status } from "./commands/status";

const HELP = `repogotchi — a pet for your repo

Usage:
  repogotchi <command> [options]

Commands:
  init       Hatch a pet for the current repo and write initial state.
  compute    Re-read git signals, recompute state, re-render SVG.
  render     Re-render pet.svg from existing pet.json + state.json.
  status     Print pet identity and current state.

Options:
  --repo-path <dir>   Repo path (default: cwd).
  -h, --help          Show this help.
`;

export async function run(argv: string[] = process.argv.slice(2)): Promise<number> {
  const { positionals, values } = parseArgs({
    args: argv,
    allowPositionals: true,
    strict: false,
    options: {
      "repo-path": { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help || positionals.length === 0) {
    process.stdout.write(HELP);
    return 0;
  }

  const repoPath = (values["repo-path"] as string | undefined) ?? process.cwd();
  const ctx = { cwd: repoPath };
  const command = positionals[0];

  try {
    switch (command) {
      case "init": {
        const r = await init(ctx);
        const verb = r.reused ? "Reused existing pet" : "Hatched new pet";
        console.log(`${verb}: ${r.petName} (${r.petId})`);
        console.log(`  pet:   ${r.paths.pet}`);
        console.log(`  state: ${r.paths.state}`);
        console.log(`  svg:   ${r.paths.svg}`);
        return 0;
      }
      case "compute": {
        const r = await compute(ctx);
        console.log(`Updated: ${r.statusHeadline} (${r.mood})`);
        console.log(`  state: ${r.paths.state}`);
        console.log(`  svg:   ${r.paths.svg}`);
        return 0;
      }
      case "render": {
        const r = await render(ctx);
        console.log(`Wrote ${r.svgPath}`);
        return 0;
      }
      case "status": {
        const r = await status(ctx);
        console.log(
          `${r.pet.name} (${r.pet.species}, level ${r.state.level} ${r.state.evolutionStage})`,
        );
        console.log(`  ${r.state.statusHeadline}`);
        console.log(
          `  mood=${r.state.mood}  health=${r.state.scores.health}  happiness=${r.state.scores.happiness}  energy=${r.state.scores.energy}`,
        );
        console.log(`  computed: ${r.state.computedAt}`);
        return 0;
      }
      default:
        process.stderr.write(`Unknown command: ${command}\n\n${HELP}`);
        return 2;
    }
  } catch (err) {
    process.stderr.write(`error: ${(err as Error).message}\n`);
    return 1;
  }
}

// Run if invoked directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(await run());
}
