import type { State } from "@repogotchi/contract";
import { FACE_CX } from "./eyes";

const MOUTH_Y = 220;

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
