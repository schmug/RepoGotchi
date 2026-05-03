import { compileFromFile } from "json-schema-to-typescript";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const tsTargets = [
  { schema: "pet.schema.json", topLevel: "Pet" },
  { schema: "state.schema.json", topLevel: "State" },
] as const;

const tsOutDir = join(root, "generated", "ts");
const swiftOutDir = join(root, "swift", "Sources", "RepoGotchiContract");

await mkdir(tsOutDir, { recursive: true });
await mkdir(swiftOutDir, { recursive: true });

// TypeScript: one file per top-level schema.
for (const { schema, topLevel } of tsTargets) {
  const schemaPath = join(root, "schemas", schema);
  const ts = await compileFromFile(schemaPath, {
    bannerComment:
      "/* eslint-disable */\n/* AUTO-GENERATED — do not edit. Run `pnpm --filter @repogotchi/contract codegen` to regenerate. */",
    style: { singleQuote: false, semi: true },
    additionalProperties: false,
  });
  const out = join(tsOutDir, `${topLevel.toLowerCase()}.ts`);
  await writeFile(out, ts);
  console.log(`wrote ${out}`);
}

// Swift: one combined file so quicktype emits a single set of
// newJSONEncoder/newJSONDecoder helpers (separate calls collide).
const swiftFile = join(swiftOutDir, "Generated.swift");
// Drop any previous per-schema files so the directory only contains the
// combined output.
for (const stale of ["Pet.swift", "State.swift"]) {
  await rm(join(swiftOutDir, stale), { force: true });
}
await runQuicktype(
  [join(root, "schemas", "pet.schema.json"), join(root, "schemas", "state.schema.json")],
  swiftFile,
);
console.log(`wrote ${swiftFile}`);

async function runQuicktype(
  schemaPaths: string[],
  outFile: string,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const quicktypeBin = join(root, "node_modules", ".bin", "quicktype");
    const child = spawn(
      quicktypeBin,
      [
        "--src-lang",
        "schema",
        "--lang",
        "swift",
        "--access-level",
        "public",
        "--protocol",
        "equatable",
        "-o",
        outFile,
        ...schemaPaths,
      ],
      { stdio: "inherit" },
    );
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`quicktype exited with code ${code}`)),
    );
    child.on("error", reject);
  });
}
