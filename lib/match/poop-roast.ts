import type { MatchWithTeams } from "@/lib/queries/players";

/** Palavras “amuleto” — cada jogador em sequência de derrota recebe uma distinta (ordem: time 1 → time 2). */
export const POOP_ROAST_WORDS = [
  "esmolinha",
  "burro",
  "refém",
  "sem qi",
  "idiota",
  "imbecil",
  "suicida",
  "sem dedo",
  "bronze",
  "jack brown",
  "cblow player",
] as const;

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(arr: T[], rng: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]!];
  }
}

const LOSS_MIN = 3;

/**
 * Para cada jogador com `lossStreak >= 3`, atribui uma palavra da lista sem repetir
 * enquanto houver palavras (ordem: slots do time 1, depois time 2). Embaralho depende do `matchId`.
 */
export function buildPoopRoastByPlayerId(
  matchId: number,
  match: MatchWithTeams,
): Record<number, string> {
  const eligible: number[] = [];
  for (const team of [1, 2] as const) {
    for (const p of match.teams[team]) {
      if (p.lossStreak >= LOSS_MIN) {
        eligible.push(p.playerId);
      }
    }
  }

  const words = [...POOP_ROAST_WORDS];
  const rng = mulberry32(matchId ^ 0x9e3779b9);
  shuffleInPlace(words, rng);

  const out: Record<number, string> = {};
  eligible.forEach((playerId, i) => {
    out[playerId] = words[i % words.length]!;
  });
  return out;
}
