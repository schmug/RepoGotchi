/* eslint-disable */
/* AUTO-GENERATED — do not edit. Run `pnpm --filter @repogotchi/contract codegen` to regenerate. */

export type HexColor = string;

/**
 * Canonical identity of a RepoGotchi pet. Stable for the pet's lifetime; live state lives in state.json.
 */
export interface Pet {
  schemaVersion: 1;
  /**
   * Stable pet identifier. Convention: sha256(host:owner/name)[:12].
   */
  id: string;
  repo: {
    host: "github";
    owner: string;
    name: string;
  };
  /**
   * Display name shown in UIs.
   */
  name: string;
  /**
   * Renderer-recognised species slug. Renderers fall back to 'blob' for unknown values.
   */
  species: string;
  palette: {
    primary: HexColor;
    secondary: HexColor;
    accent: HexColor;
    outline: HexColor;
  };
  /**
   * Free-form personality description.
   */
  personality: string;
  /**
   * Stable trait slugs that drive accessory selection in the SVG renderer.
   */
  traits: string[];
  bornAt: string;
  /**
   * Optional prompt fragment for premium image-generation tier.
   */
  visualPrompt?: string | null;
}
