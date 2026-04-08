/** Todas as combinações de 5 índices em 0..9 (ordem lexicográfica). */
function combinations5of10(): number[][] {
  const out: number[][] = [];
  for (let a = 0; a < 6; a += 1) {
    for (let b = a + 1; b < 7; b += 1) {
      for (let c = b + 1; c < 8; c += 1) {
        for (let d = c + 1; d < 9; d += 1) {
          for (let e = d + 1; e < 10; e += 1) {
            out.push([a, b, c, d, e]);
          }
        }
      }
    }
  }
  return out;
}

function randomIndex(max: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const hi = Math.floor(0xffffffff / max) * max;
  let v = buf[0]!;
  while (v >= hi) {
    crypto.getRandomValues(buf);
    v = buf[0]!;
  }
  return v % max;
}

export type PlayerScore = { id: number; score: number };

/**
 * Divide 10 jogadores em dois times de 5 minimizando |Σ PDLs time1 − Σ PDLs time2|.
 * `players` deve seguir a mesma ordem dos IDs enviados pelo cliente (índice = slot da combinação).
 * Se várias partições empatam na diferença, escolhe uma ao acaso.
 */
export function partitionTenPlayersByScore(
  players: PlayerScore[],
): { team1: number[]; team2: number[] } {
  if (players.length !== 10) {
    throw new Error("balance-teams: são necessários exatamente 10 jogadores.");
  }

  const combos = combinations5of10();
  let bestDiff = Infinity;
  const best: { team1: number[]; team2: number[] }[] = [];

  for (const pick of combos) {
    const pickSet = new Set(pick);
    const team1: number[] = [];
    const team2: number[] = [];
    let sum1 = 0;
    let sum2 = 0;
    for (let i = 0; i < 10; i += 1) {
      const p = players[i]!;
      if (pickSet.has(i)) {
        team1.push(p.id);
        sum1 += p.score;
      } else {
        team2.push(p.id);
        sum2 += p.score;
      }
    }
    const diff = Math.abs(sum1 - sum2);
    if (diff < bestDiff) {
      bestDiff = diff;
      best.length = 0;
      best.push({ team1, team2 });
    } else if (diff === bestDiff) {
      best.push({ team1, team2 });
    }
  }

  return best[randomIndex(best.length)]!;
}
