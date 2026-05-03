import { composeState, hatchPet } from "@repogotchi/core";
import { renderPet } from "@repogotchi/render-svg";
import type { Env } from "./env";
import { errorSvg } from "./errorSvg";
import { fetchRepo, GitHubError, repoToSignals } from "./github";

const PET_ROUTE = /^\/pet\/([^/]+)\/([^/]+?)\.svg$/;

export interface HandleDeps {
  fetcher?: typeof fetch;
  now?: () => Date;
}

export async function handle(
  request: Request,
  env: Env,
  deps: HandleDeps = {},
): Promise<Response> {
  const url = new URL(request.url);

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  const match = url.pathname.match(PET_ROUTE);
  if (!match) {
    return new Response("Not Found", { status: 404 });
  }

  const owner = decodeURIComponent(match[1]!);
  const repoName = decodeURIComponent(match[2]!);

  try {
    const repo = await fetchRepo(owner, repoName, env, deps.fetcher);
    if (!repo) {
      return svgResponse(errorSvg(`${owner}/${repoName} not found`), 404);
    }

    const pet = await hatchPet({
      host: "github",
      owner,
      name: repoName,
      language: repo.language,
      createdAt: repo.created_at,
    });

    const now = deps.now?.();
    const state = composeState({
      pet,
      signals: repoToSignals(repo, now),
      source: "worker",
      ...(now ? { computedAt: now.toISOString() } : {}),
    });

    const { svg } = renderPet(pet, state);
    return svgResponse(svg, 200);
  } catch (err) {
    if (err instanceof GitHubError && err.status === 403) {
      return svgResponse(errorSvg("Rate limited — try again later"), 429);
    }
    return svgResponse(errorSvg("Something went wrong"), 500);
  }
}

function svgResponse(svg: string, status: number): Response {
  return new Response(svg, {
    status,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control":
        status === 200
          ? "public, max-age=3600, s-maxage=3600"
          : "public, max-age=60",
    },
  });
}
