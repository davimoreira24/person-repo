import { shuffle } from "./shuffle-crypto";

const LANE_COUNT = 5;

/** Todas as 5! permutações de índices 0..4 (cada uma: lane → índice do jogador no time). */
function allIndexPermutations(): number[][] {
  const res: number[][] = [];
  const used = new Array(5).fill(false);
  const cur: number[] = [];

  function dfs() {
    if (cur.length === LANE_COUNT) {
      res.push([...cur]);
      return;
    }
    for (let i = 0; i < LANE_COUNT; i += 1) {
      if (used[i]) continue;
      used[i] = true;
      cur.push(i);
      dfs();
      cur.pop();
      used[i] = false;
    }
  }
  dfs();
  return res;
}

const PERMS_5 = allIndexPermutations();

/**
 * Reordena 5 jogadores nas lanes 0–4. `perm[lane]` = índice em `teamPlayerIds`.
 * Evita colocar o jogador na mesma lane da última partida encerrada, se houver.
 * Se nenhuma permutação satisfizer, cai no embaralhamento comum.
 */
export function assignTeamLaneOrderAvoidingRepeat(
  teamPlayerIds: number[],
  lastLaneByPlayer: ReadonlyMap<number, number | null>,
): number[] {
  if (teamPlayerIds.length !== LANE_COUNT) {
    throw new Error("assignTeamLaneOrderAvoidingRepeat: exatamente 5 jogadores.");
  }

  const order = shuffle(PERMS_5.map((p) => [...p]));

  for (const perm of order) {
    let ok = true;
    for (let lane = 0; lane < LANE_COUNT; lane += 1) {
      const playerIdx = perm[lane]!;
      const pid = teamPlayerIds[playerIdx]!;
      const lastLane = lastLaneByPlayer.get(pid);
      if (lastLane !== null && lastLane !== undefined && lastLane === lane) {
        ok = false;
        break;
      }
    }
    if (ok) {
      return perm.map((idx) => teamPlayerIds[idx]!);
    }
  }

  return shuffle([...teamPlayerIds]);
}
