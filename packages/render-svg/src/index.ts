import type { Pet, State } from "@repogotchi/contract";
import { escapeXmlAttr, escapeXmlText } from "./xml";
import { renderEyes } from "./parts/eyes";
import { renderMouth } from "./parts/mouth";
import { pickAccessories, renderAccessories } from "./parts/accessories";

export interface RenderOptions {
  /** Output width/height in px. Always renders into a 400x400 viewBox. Default 400. */
  size?: number;
  /** CSS color for the background rect. Default "transparent". */
  background?: string;
}

export interface RenderResult {
  svg: string;
  width: number;
  height: number;
}

export function renderPet(
  pet: Pet,
  state: State,
  opts: RenderOptions = {},
): RenderResult {
  const size = opts.size ?? 400;
  const bg = opts.background ?? "transparent";

  const { primary, secondary, outline } = pet.palette;

  const isGhost = state.mood === "ghost" || state.signals.isArchived === true;
  const groupOpacity = isGhost ? 0.55 : 1;

  // Body radius scales with health on the 0–100 axis (80 → 120).
  const cx = 200;
  const cy = 180;
  const bodyRadius = 80 + (clamp(state.scores.health, 0, 100) / 100) * 40;

  const gradId = `body-${pet.id}`;
  const ariaLabel = `${pet.name}: ${state.statusHeadline} (${state.mood}, level ${state.level})`;

  const eyes = renderEyes(state.mood, outline);
  const mouth = renderMouth(state.mood, state.scores.happiness, outline);
  const accessories = renderAccessories(pet, state);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 400 400" role="img" aria-label="${escapeXmlAttr(ariaLabel)}">
  <title>${escapeXmlText(pet.name)}</title>
  <desc>${escapeXmlText(state.statusHeadline)}</desc>
  <defs>
    <radialGradient id="${gradId}">
      <stop offset="0%" stop-color="${secondary}"/>
      <stop offset="100%" stop-color="${primary}"/>
    </radialGradient>
  </defs>
  <rect width="400" height="400" fill="${bg}"/>
  <g opacity="${groupOpacity}">
    <ellipse cx="${cx - 60}" cy="120" rx="25" ry="35" fill="${primary}" stroke="${outline}" stroke-width="2"/>
    <ellipse cx="${cx + 60}" cy="120" rx="25" ry="35" fill="${primary}" stroke="${outline}" stroke-width="2"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${n(bodyRadius)}" ry="${n(bodyRadius * 1.1)}" fill="url(#${gradId})" stroke="${outline}" stroke-width="3"/>
    <ellipse cx="${cx - 80}" cy="${cy + 10}" rx="14" ry="9" fill="#FFB6C1" opacity="0.55"/>
    <ellipse cx="${cx + 80}" cy="${cy + 10}" rx="14" ry="9" fill="#FFB6C1" opacity="0.55"/>${eyes}
    ${mouth}${accessories}
  </g>
</svg>`;

  return { svg, width: size, height: size };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function n(x: number): string {
  return Number(x.toFixed(2)).toString();
}

export { pickAccessories } from "./parts/accessories";
