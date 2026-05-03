import { describe, expect, it, vi } from "vitest";
import { run } from "../src/index";

describe("CLI dispatch", () => {
  it("prints help and exits 0 when no command given", async () => {
    const stdout = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
    const code = await run([]);
    expect(code).toBe(0);
    expect((stdout.mock.calls[0]![0] as string).startsWith("repogotchi")).toBe(
      true,
    );
    stdout.mockRestore();
  });

  it("prints help on --help", async () => {
    const stdout = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
    const code = await run(["--help"]);
    expect(code).toBe(0);
    stdout.mockRestore();
  });

  it("returns 2 on unknown command", async () => {
    const stderr = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
    const code = await run(["frobnicate"]);
    expect(code).toBe(2);
    stderr.mockRestore();
  });
});
