import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchPlayers, matches, players } from "@/lib/db/schema";
import {
  buildChallengeDiscordMessage,
  matchChallengePath,
  teamPdlDelta,
} from "@/lib/match/challenge";
import { matchPrePartidaPath } from "@/lib/match/routes";

export type ChallengeStatus = {
  activeCount: number;
  total: number;
  locked: boolean;
};

export type ChallengeByToken = {
  matchId: number;
  playerId: number;
  playerName: string;
  challengeActive: boolean;
  locked: boolean;
};

export async function getChallengeStatus(
  matchId: number,
): Promise<ChallengeStatus | null> {
  const [head] = await db
    .select({
      loadoutCompletedAt: matches.loadoutCompletedAt,
      winnerTeam: matches.winnerTeam,
    })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!head) return null;

  const [counts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      activeCount: sql<number>`count(*) filter (where ${matchPlayers.challengeActive} = true)::int`,
    })
    .from(matchPlayers)
    .where(eq(matchPlayers.matchId, matchId));

  return {
    activeCount: counts?.activeCount ?? 0,
    total: counts?.total ?? 0,
    locked: head.loadoutCompletedAt != null || head.winnerTeam != null,
  };
}

export async function getChallengeByToken(
  token: string,
): Promise<ChallengeByToken | null> {
  const rows = await db
    .select({
      matchId: matchPlayers.matchId,
      playerId: matchPlayers.playerId,
      playerName: players.name,
      challengeActive: matchPlayers.challengeActive,
      loadoutCompletedAt: matches.loadoutCompletedAt,
      winnerTeam: matches.winnerTeam,
    })
    .from(matchPlayers)
    .innerJoin(players, eq(matchPlayers.playerId, players.id))
    .innerJoin(matches, eq(matchPlayers.matchId, matches.id))
    .where(eq(matchPlayers.challengeToken, token))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    matchId: row.matchId,
    playerId: row.playerId,
    playerName: row.playerName,
    challengeActive: row.challengeActive === true,
    locked: row.loadoutCompletedAt != null || row.winnerTeam != null,
  };
}

export async function buildChallengeDiscordMessageForMatch(
  matchId: number,
  origin: string,
): Promise<string | null> {
  const rows = await db
    .select({
      name: players.name,
      token: matchPlayers.challengeToken,
    })
    .from(matchPlayers)
    .innerJoin(players, eq(matchPlayers.playerId, players.id))
    .where(eq(matchPlayers.matchId, matchId))
    .orderBy(asc(matchPlayers.id));

  if (rows.length === 0) return null;

  return buildChallengeDiscordMessage({
    matchId,
    origin,
    prePartidaUrl: matchPrePartidaPath(matchId),
    links: rows.map((row) => ({
      name: row.name,
      url: matchChallengePath(matchId, row.token),
    })),
  });
}

export type ChallengeRevealEntry = {
  playerId: number;
  name: string;
  team: 1 | 2;
  isWinner: boolean;
  pdlDelta: number;
};

export async function getChallengeRevealForMatch(
  matchId: number,
  winnerTeam: 1 | 2,
): Promise<ChallengeRevealEntry[]> {
  const rows = await db
    .select({
      playerId: players.id,
      name: players.name,
      team: matchPlayers.team,
      challengeActive: matchPlayers.challengeActive,
    })
    .from(matchPlayers)
    .innerJoin(players, eq(matchPlayers.playerId, players.id))
    .where(eq(matchPlayers.matchId, matchId))
    .orderBy(asc(matchPlayers.id));

  return rows
    .filter((row) => row.challengeActive === true)
    .map((row) => {
      const team = row.team as 1 | 2;
      const isWinner = team === winnerTeam;
      return {
        playerId: row.playerId,
        name: row.name,
        team,
        isWinner,
        pdlDelta: teamPdlDelta(isWinner, true),
      };
    });
}
