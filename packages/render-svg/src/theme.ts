export type Theme = "auto" | "light" | "dark";

export interface ResolvedTheme {
  /** Inline <style> block content for the SVG. */
  styleBlock: string;
}

interface ThemeColors {
  outline: string;
  blush: string;
  tear: string;
}

const LIGHT: ThemeColors = {
  outline: "#1A1A1A",
  blush: "#FFB6C1",
  tear: "#5BA8FF",
};
const DARK: ThemeColors = {
  outline: "#E8E8E8",
  blush: "#FF8FA3",
  tear: "#87C5FF",
};

function rootRule(c: ThemeColors): string {
  return `:root { --outline: ${c.outline}; --blush: ${c.blush}; --tear: ${c.tear}; }`;
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "auto") {
    return {
      styleBlock: `<style>
    ${rootRule(LIGHT)}
    @media (prefers-color-scheme: dark) {
      ${rootRule(DARK)}
    }
  </style>`,
    };
  }
  return {
    styleBlock: `<style>
    ${rootRule(theme === "dark" ? DARK : LIGHT)}
  </style>`,
  };
}

export type Detail = "auto" | "full" | "compact";

export function resolveDetail(detail: Detail, size: number): "full" | "compact" {
  if (detail === "auto") return size <= 64 ? "compact" : "full";
  return detail;
}
