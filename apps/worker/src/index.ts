import type { Env } from "./env";
import { handle } from "./handler";

export type { Env };
export { handle };

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handle(request, env);
  },
} satisfies ExportedHandler<Env>;
