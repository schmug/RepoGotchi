import type { Pet, State } from "@repogotchi/contract";

export function escapeXmlText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeXmlAttr(s: string): string {
  return escapeXmlText(s).replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

const FACE_CX = 200;
const EYE_Y = 160;
const EYE_OFFSET = 50;
const MOUTH_Y = 220;

export function renderEyes(mood: State["mood"], outline: string): string {
  const lx = FACE_CX - EYE_OFFSET;
  const rx = FACE_CX + EYE_OFFSET;
  const stroke = `stroke="${outline}" stroke-width="3" fill="none"`;
  const fill = `fill="${outline}"`;

  switch (mood) {
    case "happy":
      return `
    <path d="M ${lx - 10} ${EYE_Y} Q ${lx} ${EYE_Y - 10} ${lx + 10} ${EYE_Y}" ${stroke}/>
    <path d="M ${rx - 10} ${EYE_Y} Q ${rx} ${EYE_Y - 10} ${rx + 10} ${EYE_Y}" ${stroke}/>`;

    case "excited":
      return `
    <circle cx="${lx}" cy="${EYE_Y}" r="9" ${fill}/>
    <circle cx="${rx}" cy="${EYE_Y}" r="9" ${fill}/>
    <circle cx="${lx + 2}" cy="${EYE_Y - 3}" r="2" fill="white"/>
    <circle cx="${rx + 2}" cy="${EYE_Y - 3}" r="2" fill="white"/>`;

    case "sad":
      return `
    <path d="M ${lx - 10} ${EYE_Y - 10} Q ${lx} ${EYE_Y} ${lx + 10} ${EYE_Y - 10}" ${stroke}/>
    <path d="M ${rx - 10} ${EYE_Y - 10} Q ${rx} ${EYE_Y} ${rx + 10} ${EYE_Y - 10}" ${stroke}/>
    <path d="M ${lx} ${EYE_Y + 5} L ${lx - 4} ${EYE_Y + 18}" stroke="#5BA8FF" stroke-width="3" fill="none"/>
    <path d="M ${rx} ${EYE_Y + 5} L ${rx + 4} ${EYE_Y + 18}" stroke="#5BA8FF" stroke-width="3" fill="none"/>`;

    case "sick":
      return `
    <path d="M ${lx - 8} ${EYE_Y - 8} L ${lx + 8} ${EYE_Y + 8} M ${lx + 8} ${EYE_Y - 8} L ${lx - 8} ${EYE_Y + 8}" stroke="${outline}" stroke-width="3"/>
    <path d="M ${rx - 8} ${EYE_Y - 8} L ${rx + 8} ${EYE_Y + 8} M ${rx + 8} ${EYE_Y - 8} L ${rx - 8} ${EYE_Y + 8}" stroke="${outline}" stroke-width="3"/>`;

    case "angry":
      return `
    <path d="M ${lx - 12} ${EYE_Y - 8} L ${lx + 12} ${EYE_Y + 4}" stroke="${outline}" stroke-width="4" stroke-linecap="round"/>
    <path d="M ${rx + 12} ${EYE_Y - 8} L ${rx - 12} ${EYE_Y + 4}" stroke="${outline}" stroke-width="4" stroke-linecap="round"/>`;

    case "sleepy":
      return `
    <path d="M ${lx - 10} ${EYE_Y} Q ${lx} ${EYE_Y + 6} ${lx + 10} ${EYE_Y}" ${stroke}/>
    <path d="M ${rx - 10} ${EYE_Y} Q ${rx} ${EYE_Y + 6} ${rx + 10} ${EYE_Y}" ${stroke}/>`;

    case "ghost":
      return `
    <circle cx="${lx}" cy="${EYE_Y}" r="10" fill="none" stroke="${outline}" stroke-width="2"/>
    <circle cx="${rx}" cy="${EYE_Y}" r="10" fill="none" stroke="${outline}" stroke-width="2"/>`;
  }
}

export function renderMouth(
  mood: State["mood"],
  happiness: number,
  outline: string,
): string {
  const stroke = `stroke="${outline}" stroke-width="3" fill="none"`;

  switch (mood) {
    case "happy": {
      const lift = Math.min(20, 8 + happiness / 8);
      return `<path d="M ${FACE_CX - 40} ${MOUTH_Y} Q ${FACE_CX} ${MOUTH_Y + lift} ${FACE_CX + 40} ${MOUTH_Y}" ${stroke}/>`;
    }
    case "excited":
      return `<ellipse cx="${FACE_CX}" cy="${MOUTH_Y + 8}" rx="22" ry="14" fill="${outline}"/>
    <ellipse cx="${FACE_CX}" cy="${MOUTH_Y + 4}" rx="14" ry="6" fill="#ff6b81"/>`;
    case "sad":
      return `<path d="M ${FACE_CX - 40} ${MOUTH_Y + 10} Q ${FACE_CX} ${MOUTH_Y - 10} ${FACE_CX + 40} ${MOUTH_Y + 10}" ${stroke}/>`;
    case "sick":
      return `<path d="M ${FACE_CX - 40} ${MOUTH_Y} q 10 -8 20 0 t 20 0 t 20 0" ${stroke}/>`;
    case "angry":
      return `<path d="M ${FACE_CX - 30} ${MOUTH_Y + 8} l 12 -10 l 12 10 l 12 -10 l 12 10" ${stroke} stroke-linejoin="miter"/>`;
    case "sleepy":
      return `<line x1="${FACE_CX - 12}" y1="${MOUTH_Y}" x2="${FACE_CX + 12}" y2="${MOUTH_Y}" stroke="${outline}" stroke-width="3" stroke-linecap="round"/>`;
    case "ghost":
      return `<circle cx="${FACE_CX}" cy="${MOUTH_Y + 4}" r="6" fill="${outline}"/>`;
  }
}

interface AccessoryFlags {
  crown: boolean;
  glasses: boolean;
  sparkles: boolean;
  zzz: boolean;
}

export function pickAccessories(pet: Pet, state: State): AccessoryFlags {
  const traits = new Set(pet.traits);
  const stars = state.signals.stars ?? 0;
  const contributors = state.signals.contributors ?? 0;
  const lastCommit = state.signals.lastCommitDaysAgo ?? Number.POSITIVE_INFINITY;

  return {
    crown: stars >= 100 || traits.has("popular"),
    glasses: contributors >= 5 || traits.has("scholarly"),
    sparkles: lastCommit <= 7 || traits.has("active"),
    zzz: state.mood === "sleepy" || lastCommit > 30,
  };
}

export function renderAccessories(pet: Pet, state: State): string {
  const flags = pickAccessories(pet, state);
  const accent = pet.palette.accent;
  const outline = pet.palette.outline;
  const parts: string[] = [];

  if (flags.crown) {
    parts.push(`
    <g aria-label="crown">
      <path d="M 150 80 L 160 100 L 170 85 L 180 100 L 190 85 L 200 100 L 210 85 L 220 100 L 230 85 L 240 100 L 250 80 L 150 80 Z"
            fill="${accent}" stroke="${outline}" stroke-width="2"/>
      <circle cx="165" cy="85" r="4" fill="#FF6B6B"/>
      <circle cx="200" cy="80" r="4" fill="#FF6B6B"/>
      <circle cx="235" cy="85" r="4" fill="#FF6B6B"/>
    </g>`);
  }

  if (flags.glasses) {
    parts.push(`
    <g aria-label="glasses" opacity="0.85">
      <circle cx="${FACE_CX - EYE_OFFSET}" cy="${EYE_Y}" r="20" fill="none" stroke="${outline}" stroke-width="2"/>
      <circle cx="${FACE_CX + EYE_OFFSET}" cy="${EYE_Y}" r="20" fill="none" stroke="${outline}" stroke-width="2"/>
      <line x1="${FACE_CX - EYE_OFFSET + 20}" y1="${EYE_Y}" x2="${FACE_CX + EYE_OFFSET - 20}" y2="${EYE_Y}" stroke="${outline}" stroke-width="2"/>
    </g>`);
  }

  if (flags.sparkles) {
    parts.push(`
    <g aria-label="sparkles">
      <path d="M 320 120 L 325 130 L 330 120 L 325 110 Z" fill="${accent}"/>
      <path d="M 70 120 L 75 130 L 80 120 L 75 110 Z" fill="${accent}"/>
      <path d="M 200 50 L 205 60 L 210 50 L 205 40 Z" fill="${accent}"/>
    </g>`);
  }

  if (flags.zzz) {
    parts.push(`
    <g aria-label="zzz" font-family="monospace" font-weight="bold" fill="${outline}">
      <text x="290" y="100" font-size="22">Z</text>
      <text x="310" y="80" font-size="16">z</text>
      <text x="325" y="65" font-size="12">z</text>
    </g>`);
  }

  return parts.join("");
}
