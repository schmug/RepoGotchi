import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readInputs } from "../src/inputs";

describe("readInputs", () => {
  const original = { ...process.env };

  beforeEach(() => {
    for (const k of Object.keys(process.env)) {
      if (k.startsWith("INPUT_")) delete process.env[k];
    }
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it("reads commit, message, output-dir, token from INPUT_* env vars", () => {
    process.env.INPUT_COMMIT = "false";
    process.env["INPUT_COMMIT-MESSAGE"] = "ci: pet refresh";
    process.env["INPUT_OUTPUT-DIR"] = ".rg";
    process.env["INPUT_GITHUB-TOKEN"] = "ghs_xxx";

    const inputs = readInputs();
    expect(inputs.commit).toBe(false);
    expect(inputs.commitMessage).toBe("ci: pet refresh");
    expect(inputs.outputDir).toBe(".rg");
    expect(inputs.githubToken).toBe("ghs_xxx");
  });

  it("uses defaults when optional inputs are blank", () => {
    process.env.INPUT_COMMIT = "true";
    process.env["INPUT_GITHUB-TOKEN"] = "ghs_xxx";

    const inputs = readInputs();
    expect(inputs.commit).toBe(true);
    expect(inputs.commitMessage).toMatch(/refresh pet/);
    expect(inputs.outputDir).toBe(".repogotchi");
  });
});
