import { and, asc, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchPlayers, matches } from "@/lib/db/schema";

/**
 * Para cada jogador: índice de lane na última partida **encerrada** (0=top … 4=sup),
 * ou `null` se não houver histórico. Ordem das lanes = ordem de inserção em
 * `match_players` (5 do time 1, depois 5 do time 2).
 */
export async function getLastLaneIndexByPlayerId(
  playerIds: number[],
): Promise<Map<number, number | null>> {
  const out = new Map<number, number | null>();
  for (const id of playerIds) {
    out.set(id, null);
  }
  if (playerIds.length === 0) {
    return out;
  }

  const rows = await db
    .select({
      playerId: matchPlayers.playerId,
      matchId: matchPlayers.matchId,
      completedAt: matches.completedAt,
    })
    .from(matchPlayers)
    .innerJoin(matches, eq(matchPlayers.matchId, matches.id))
    .where(
      and(
        inArray(matchPlayers.playerId, playerIds),
        isNotNull(matches.winnerTeam),
      ),
    )
    .orderBy(desc(matches.completedAt), asc(matchPlayers.id));

  const latestMatchByPlayer = new Map<number, number>();
  for (const row of rows) {
    if (!latestMatchByPlayer.has(row.playerId)) {
      latestMatchByPlayer.set(row.playerId, row.matchId);
    }
  }

  const matchIdsNeeded = [...new Set(latestMatchByPlayer.values())];
  if (matchIdsNeeded.length === 0) {
    return out;
  }

  const orderRows = await db
    .select({
      matchId: matchPlayers.matchId,
      playerId: matchPlayers.playerId,
    })
    .from(matchPlayers)
    .where(inArray(matchPlayers.matchId, matchIdsNeeded))
    .orderBy(asc(matchPlayers.matchId), asc(matchPlayers.id));

  const matchToPlayers = new Map<number, number[]>();
  for (const r of orderRows) {
    if (!matchToPlayers.has(r.matchId)) {
      matchToPlayers.set(r.matchId, []);
    }
    matchToPlayers.get(r.matchId)!.push(r.playerId);
  }

  for (const [pid, mid] of latestMatchByPlayer) {
    const ordered = matchToPlayers.get(mid);
    if (!ordered || ordered.length !== 10) {
      continue;
    }
    const idx = ordered.indexOf(pid);
    if (idx === -1) {
      continue;
    }
    const lane = idx < 5 ? idx : idx - 5;
    out.set(pid, lane);
  }

  return out;
}
