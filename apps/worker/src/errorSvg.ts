export function errorSvg(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="160" viewBox="0 0 400 160" role="img" aria-label="RepoGotchi error: ${escapeXml(message)}">
  <rect width="400" height="160" rx="12" ry="12" fill="#FFF1F1" stroke="#F4B5B5" stroke-width="2"/>
  <text x="200" y="62" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="13" font-weight="bold" fill="#7A1414" text-anchor="middle">RepoGotchi</text>
  <text x="200" y="92" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="14" fill="#7A1414" text-anchor="middle">${escapeXml(message)}</text>
</svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
