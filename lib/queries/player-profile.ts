import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { players, type Player } from "@/lib/db/schema";
import {
  getPlayerCareerStatsMap,
  type PlayerCareerStats,
} from "@/lib/queries/players";

export type PlayerProfile = {
  player: Player;
  /** Posição no ranking por PDL (1 = primeiro). */
  rankPosition: number;
  totalPlayers: number;
  careerStats: PlayerCareerStats;
};

export async function getPlayerProfile(
  playerId: number,
): Promise<PlayerProfile | null> {
  const [player] = await db
    .select()
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1);

  if (!player) return null;

  const [ranked, careerMap] = await Promise.all([
    db
      .select({ id: players.id, score: players.score })
      .from(players)
      .orderBy(desc(players.score), asc(players.name)),
    getPlayerCareerStatsMap(),
  ]);

  const rankPosition = ranked.findIndex((row) => row.id === playerId) + 1;

  return {
    player,
    rankPosition: rankPosition > 0 ? rankPosition : ranked.length,
    totalPlayers: ranked.length,
    careerStats: careerMap.get(playerId) ?? {
      wins: 0,
      losses: 0,
      mvpCount: 0,
      dudCount: 0,
    },
  };
}
