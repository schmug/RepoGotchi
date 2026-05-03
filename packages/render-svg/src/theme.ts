export type Theme = "auto" | "light" | "dark";

export interface ResolvedTheme {
  /** Inline <style> block content for the SVG. */
  styleBlock: string;
}

const LIGHT = {
  outline: "#1A1A1A",
  blush: "#FFB6C1",
  tear: "#5BA8FF",
};
const DARK = {
  outline: "#E8E8E8",
  blush: "#FF8FA3",
  tear: "#87C5FF",
};

export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "auto") {
    return {
      styleBlock: `<style>
    :root { --outline: ${LIGHT.outline}; --blush: ${LIGHT.blush}; --tear: ${LIGHT.tear}; }
    @media (prefers-color-scheme: dark) {
      :root { --outline: ${DARK.outline}; --blush: ${DARK.blush}; --tear: ${DARK.tear}; }
    }
  </style>`,
    };
  }
  const v = theme === "dark" ? DARK : LIGHT;
  return {
    styleBlock: `<style>
    :root { --outline: ${v.outline}; --blush: ${v.blush}; --tear: ${v.tear}; }
  </style>`,
  };
}
