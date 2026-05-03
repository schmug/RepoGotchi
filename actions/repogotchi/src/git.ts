// Wraps @actions/exec, which spawns processes with args as an array (no
// shell). Inputs are constants from action.yml, not user-controlled strings,
// so command-injection is structurally not possible.
import { exec as runExec } from "@actions/exec";

const BOT_NAME = "repogotchi[bot]";
const BOT_EMAIL = "repogotchi[bot]@users.noreply.github.com";

async function git(
  args: string[],
): Promise<{ stdout: string; code: number }> {
  let stdout = "";
  const code = await runExec("git", args, {
    silent: true,
    ignoreReturnCode: true,
    listeners: { stdout: (data) => (stdout += data.toString()) },
  });
  return { stdout, code };
}

export async function configureIdentity(): Promise<void> {
  await git(["config", "user.name", BOT_NAME]);
  await git(["config", "user.email", BOT_EMAIL]);
}

export async function workingTreeIsClean(paths: string[]): Promise<boolean> {
  const { stdout } = await git(["status", "--porcelain", "--", ...paths]);
  return stdout.trim().length === 0;
}

export async function commitAndPush(
  paths: string[],
  message: string,
): Promise<void> {
  await git(["add", "--", ...paths]);
  if (await workingTreeIsClean(paths)) return;
  const commit = await git(["commit", "-m", message]);
  if (commit.code !== 0) throw new Error("git commit failed");
  const push = await git(["push"]);
  if (push.code !== 0) throw new Error("git push failed");
}
