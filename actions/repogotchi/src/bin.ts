// Bundle entry. Kept separate from index.ts so tests can import { run }
// without triggering the action.
import { run } from "./index";

void run();
