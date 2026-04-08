import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchPlayers, matches, players } from "@/lib/db/schema";

export type ChampionWinRateRow = {
  championKey: string;
  championName: string;
  wins: number;
  games: number;
  winRate: number;
};

/** Win rate por campeão só em partidas encerradas com modo aleatório (há champion_key). */
export async function getChampionWinRates(): Promise<ChampionWinRateRow[]> {
  const rows = await db
    .select({
      championKey: matchPlayers.championKey,
      championName: matchPlayers.championName,
      team: matchPlayers.team,
      winnerTeam: matches.winnerTeam,
    })
    .from(matchPlayers)
    .innerJoin(matches, eq(matchPlayers.matchId, matches.id))
    .where(
      and(
        isNotNull(matchPlayers.championKey),
        isNotNull(matches.winnerTeam),
      ),
    );

  const map = new Map<
    string,
    { championName: string; wins: number; games: number }
  >();

  for (const r of rows) {
    const key = r.championKey!;
    const won = r.winnerTeam === r.team;
    const cur = map.get(key) ?? {
      championName: r.championName ?? key,
      wins: 0,
      games: 0,
    };
    cur.games += 1;
    if (won) cur.wins += 1;
    if (r.championName) cur.championName = r.championName;
    map.set(key, cur);
  }

  return Array.from(map.entries())
    .map(([championKey, v]) => ({
      championKey,
      championName: v.championName,
      wins: v.wins,
      games: v.games,
      winRate: v.games > 0 ? v.wins / v.games : 0,
    }))
    .sort((a, b) => b.games - a.games || b.winRate - a.winRate);
}

export type PlayerChampionStat = {
  playerId: number;
  playerName: string;
  wins: number;
  games: number;
  winRate: number;
};

/**
 * Por campeão, lista de jogadores com win rate nesse campeão (partidas encerradas, modo aleatório).
 * Ordenação por win rate, depois por jogos.
 */
export async function getChampionPlayerLeaderboards(): Promise<
  Record<string, PlayerChampionStat[]>
> {
  const rows = await db
    .select({
      championKey: matchPlayers.championKey,
      playerId: matchPlayers.playerId,
      playerName: players.name,
      team: matchPlayers.team,
      winnerTeam: matches.winnerTeam,
    })
    .from(matchPlayers)
    .innerJoin(matches, eq(matchPlayers.matchId, matches.id))
    .innerJoin(players, eq(matchPlayers.playerId, players.id))
    .where(
      and(
        isNotNull(matchPlayers.championKey),
        isNotNull(matches.winnerTeam),
      ),
    );

  const byChampion = new Map<
    string,
    Map<number, { playerName: string; wins: number; games: number }>
  >();

  for (const r of rows) {
    const ck = r.championKey!;
    if (!byChampion.has(ck)) {
      byChampion.set(ck, new Map());
    }
    const perPlayer = byChampion.get(ck)!;
    const won = r.winnerTeam === r.team;
    const cur = perPlayer.get(r.playerId) ?? {
      playerName: r.playerName,
      wins: 0,
      games: 0,
    };
    cur.games += 1;
    if (won) cur.wins += 1;
    perPlayer.set(r.playerId, cur);
  }

  const out: Record<string, PlayerChampionStat[]> = {};
  for (const [championKey, perPlayer] of byChampion) {
    out[championKey] = Array.from(perPlayer.entries())
      .map(([playerId, v]) => ({
        playerId,
        playerName: v.playerName,
        wins: v.wins,
        games: v.games,
        winRate: v.games > 0 ? v.wins / v.games : 0,
      }))
      .sort((a, b) => {
        if (b.winRate !== a.winRate) {
          return b.winRate - a.winRate;
        }
        return b.games - a.games;
      });
  }

  return out;
}
