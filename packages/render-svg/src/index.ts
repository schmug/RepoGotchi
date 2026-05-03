import type { Pet, State } from "@repogotchi/contract";
import { derivePetVariation } from "@repogotchi/core";
import { renderAccessories } from "./parts/accessories";
import { renderBody } from "./parts/body";
import { renderCheeks } from "./parts/cheeks";
import { renderEars } from "./parts/ears";
import { renderEyes } from "./parts/eyes";
import { renderMouth } from "./parts/mouth";
import { renderTrinket } from "./parts/trinket";
import { resolveTheme, type Theme } from "./theme";
import { escapeXmlAttr, escapeXmlText } from "./xml";

export interface RenderOptions {
  /** Output width/height in px. Always renders into a 400x400 viewBox. Default 400. */
  size?: number;
  /** CSS color for the background rect. Default "transparent". */
  background?: string;
  /**
   * Theme strategy for outline / blush / tear colors. Default "auto" emits a
   * prefers-color-scheme media query so a single SVG works on light and dark
   * GitHub READMEs. The pet's identity palette (primary/secondary/accent) is
   * never theme-swapped.
   */
  theme?: Theme;
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
  const theme = opts.theme ?? "auto";
  const { styleBlock } = resolveTheme(theme);
  const themedOutline = "var(--outline)";

  const variation = derivePetVariation(pet);
  const { primary, secondary } = pet.palette;

  const isGhost = state.mood === "ghost" || state.signals.isArchived === true;
  const groupOpacity = isGhost ? 0.55 : 1;

  const radius = 80 + (clamp(state.scores.health, 0, 100) / 100) * 40;

  const gradId = `body-${pet.id}`;
  const ariaLabel = `${pet.name}: ${state.statusHeadline} (${state.mood}, level ${state.level})`;

  const body = renderBody(variation.silhouette, radius, `url(#${gradId})`, themedOutline);
  const ears = renderEars(variation.earKind, pet, themedOutline);
  const cheeks = renderCheeks(variation.cheekKind, pet);
  const trinket = renderTrinket(variation.trinket, pet, themedOutline);
  const eyes = renderEyes(state.mood, variation.eyeKind, themedOutline);
  const mouth = renderMouth(state.mood, state.scores.happiness, themedOutline);
  const accessories = renderAccessories(pet, state, themedOutline);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 400 400" role="img" aria-label="${escapeXmlAttr(ariaLabel)}">
  ${styleBlock}
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
    ${body}
    ${cheeks}
    ${eyes}
    ${mouth}
    ${trinket}
    ${ears}${accessories}
  </g>
</svg>`;

  return { svg, width: size, height: size };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export { pickAccessories } from "./parts/accessories";
