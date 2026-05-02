import { compileFromFile } from "json-schema-to-typescript";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const targets = [
  { schema: "pet.schema.json", topLevel: "Pet" },
  { schema: "state.schema.json", topLevel: "State" },
] as const;

const tsOutDir = join(root, "generated", "ts");
const swiftOutDir = join(root, "generated", "swift");

await mkdir(tsOutDir, { recursive: true });
await mkdir(swiftOutDir, { recursive: true });

for (const { schema, topLevel } of targets) {
  const schemaPath = join(root, "schemas", schema);

  const ts = await compileFromFile(schemaPath, {
    bannerComment:
      "/* eslint-disable */\n/* AUTO-GENERATED — do not edit. Run `pnpm --filter @repogotchi/contract codegen` to regenerate. */",
    style: { singleQuote: false, semi: true },
    additionalProperties: false,
  });
  const tsFile = join(tsOutDir, `${topLevel.toLowerCase()}.ts`);
  await writeFile(tsFile, ts);
  console.log(`wrote ${tsFile}`);

  const swiftFile = join(swiftOutDir, `${topLevel}.swift`);
  await runQuicktype(schemaPath, topLevel, swiftFile);
  console.log(`wrote ${swiftFile}`);
}

async function runQuicktype(
  schemaPath: string,
  topLevel: string,
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
        "--top-level",
        topLevel,
        "--access-level",
        "public",
        "--protocol",
        "equatable",
        "-o",
        outFile,
        schemaPath,
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
