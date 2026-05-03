import type { State } from "@repogotchi/contract";

export const FACE_CX = 200;
export const EYE_Y = 160;
export const EYE_OFFSET = 50;

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
