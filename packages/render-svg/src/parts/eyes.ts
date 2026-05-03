import type { State } from "@repogotchi/contract";
import type { PetVariation } from "@repogotchi/core";

export const FACE_CX = 200;
export const EYE_Y = 160;
export const EYE_OFFSET = 50;

export function renderEyes(
  mood: State["mood"],
  eyeKind: PetVariation["eyeKind"],
  outline: string,
): string {
  const lx = FACE_CX - EYE_OFFSET;
  const rx = FACE_CX + EYE_OFFSET;
  const stroke = `stroke="${outline}" stroke-width="3" fill="none"`;

  // Mood overrides for the expressive moods. These ignore eyeKind because
  // their visual identity (tears, X-eyes, slits) is mood-specific.
  switch (mood) {
    case "sad":
      return `
    <path d="M ${lx - 10} ${EYE_Y - 10} Q ${lx} ${EYE_Y} ${lx + 10} ${EYE_Y - 10}" ${stroke}/>
    <path d="M ${rx - 10} ${EYE_Y - 10} Q ${rx} ${EYE_Y} ${rx + 10} ${EYE_Y - 10}" ${stroke}/>
    <path d="M ${lx} ${EYE_Y + 5} L ${lx - 4} ${EYE_Y + 18}" stroke="var(--tear)" stroke-width="3" fill="none"/>
    <path d="M ${rx} ${EYE_Y + 5} L ${rx + 4} ${EYE_Y + 18}" stroke="var(--tear)" stroke-width="3" fill="none"/>`;

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

    // Baseline moods read eyeKind.
    case "happy":
    case "excited":
    default:
      return baselineEyes(eyeKind, lx, rx, outline, mood === "excited");
  }
}

function baselineEyes(
  eyeKind: PetVariation["eyeKind"],
  lx: number,
  rx: number,
  outline: string,
  hyped: boolean,
): string {
  switch (eyeKind) {
    case "round": {
      // Today's "excited" baseline applied to the open-eyed moods.
      if (hyped) {
        return `
    <circle cx="${lx}" cy="${EYE_Y}" r="9" fill="${outline}"/>
    <circle cx="${rx}" cy="${EYE_Y}" r="9" fill="${outline}"/>
    <circle cx="${lx + 2}" cy="${EYE_Y - 3}" r="2" fill="white"/>
    <circle cx="${rx + 2}" cy="${EYE_Y - 3}" r="2" fill="white"/>`;
      }
      return `
    <path d="M ${lx - 10} ${EYE_Y} Q ${lx} ${EYE_Y - 10} ${lx + 10} ${EYE_Y}" stroke="${outline}" stroke-width="3" fill="none"/>
    <path d="M ${rx - 10} ${EYE_Y} Q ${rx} ${EYE_Y - 10} ${rx + 10} ${EYE_Y}" stroke="${outline}" stroke-width="3" fill="none"/>`;
    }

    case "almond":
      return `
    <ellipse cx="${lx}" cy="${EYE_Y}" rx="10" ry="5" fill="none" stroke="${outline}" stroke-width="2.5"/>
    <ellipse cx="${rx}" cy="${EYE_Y}" rx="10" ry="5" fill="none" stroke="${outline}" stroke-width="2.5"/>
    <circle cx="${lx}" cy="${EYE_Y}" r="2.5" fill="${outline}"/>
    <circle cx="${rx}" cy="${EYE_Y}" r="2.5" fill="${outline}"/>`;

    case "bead":
      return `
    <circle cx="${lx}" cy="${EYE_Y}" r="4" fill="${outline}"/>
    <circle cx="${rx}" cy="${EYE_Y}" r="4" fill="${outline}"/>`;

    case "wide":
      return `
    <ellipse cx="${lx}" cy="${EYE_Y}" rx="11" ry="13" fill="white" stroke="${outline}" stroke-width="2"/>
    <ellipse cx="${rx}" cy="${EYE_Y}" rx="11" ry="13" fill="white" stroke="${outline}" stroke-width="2"/>
    <ellipse cx="${lx}" cy="${EYE_Y + 1}" rx="3" ry="6" fill="${outline}"/>
    <ellipse cx="${rx}" cy="${EYE_Y + 1}" rx="3" ry="6" fill="${outline}"/>`;
  }
}
