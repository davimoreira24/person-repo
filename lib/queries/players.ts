import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  matchAwards,
  matchPlayers,
  matches,
  players,
} from "@/lib/db/schema";

export async function getPlayers() {
  const data = await db
    .select()
    .from(players)
    .orderBy(asc(players.name));

  return data;
}

export type MatchTeamPlayer = {
  playerId: number;
  name: string;
  photoUrl: string | null;
  score: number;
  team: 1 | 2;
  isWinner: boolean;
  isMvp: boolean;
  isDud: boolean;
};

export interface MatchWithTeams {
  id: number;
  createdAt: Date | null;
  completedAt: Date | null;
  winnerTeam: 1 | 2 | null;
  awards: {
    mvpPlayerId: number | null;
    dudPlayerId: number | null;
  };
  teams: {
    1: MatchTeamPlayer[];
    2: MatchTeamPlayer[];
  };
}

export async function getMatchById(matchId: number): Promise<MatchWithTeams | null> {
  const matchRows = await db
    .select({
      matchId: matches.id,
      createdAt: matches.createdAt,
      completedAt: matches.completedAt,
      winnerTeam: matches.winnerTeam,
      playerId: players.id,
      name: players.name,
      photoUrl: players.photoUrl,
      score: players.score,
      team: matchPlayers.team,
      matchPlayerId: matchPlayers.id,
    })
    .from(matches)
    .leftJoin(matchPlayers, eq(matchPlayers.matchId, matches.id))
    .leftJoin(players, eq(matchPlayers.playerId, players.id))
    .where(eq(matches.id, matchId))
    .orderBy(asc(matchPlayers.id));

  if (matchRows.length === 0) {
    return null;
  }

  const matchInfo = matchRows[0];

  const awardsRows = await db
    .select({
      playerId: matchAwards.playerId,
      awardType: matchAwards.awardType,
    })
    .from(matchAwards)
    .where(eq(matchAwards.matchId, matchId));

  const awardMap = {
    mvpPlayerId:
      awardsRows.find((award) => award.awardType === "mvp")?.playerId ?? null,
    dudPlayerId:
      awardsRows.find((award) => award.awardType === "dud")?.playerId ?? null,
  };

  const winnerTeam = (matchInfo.winnerTeam as 1 | 2 | null) ?? null;

  const teams = {
    1: [] as MatchTeamPlayer[],
    2: [] as MatchTeamPlayer[],
  };

  matchRows.forEach((row) => {
    if (!row.playerId || !row.team) return;
    const teamNumber = row.team as 1 | 2;
    const isWinner = winnerTeam !== null ? teamNumber === winnerTeam : false;
    const playerId = row.playerId;
    teams[teamNumber].push({
      playerId,
      name: row.name ?? "Jogador",
      photoUrl: row.photoUrl ?? null,
      score: row.score ?? 0,
      team: teamNumber,
      isWinner,
      isMvp: awardMap.mvpPlayerId === playerId,
      isDud: awardMap.dudPlayerId === playerId,
    });
  });

  return {
    id: matchInfo.matchId,
    createdAt: matchInfo.createdAt,
    completedAt: matchInfo.completedAt,
    winnerTeam,
    awards: awardMap,
    teams,
  };
}

export async function getRecentMatches(limit = 5) {
  const data = await db
    .select()
    .from(matches)
    .orderBy(desc(matches.createdAt))
    .limit(limit);

  return data;
}

export async function getMatchPlayers(matchId: number, team: 1 | 2) {
  return db
    .select({
      playerId: players.id,
      name: players.name,
      photoUrl: players.photoUrl,
      score: players.score,
      team: matchPlayers.team,
    })
    .from(matchPlayers)
    .innerJoin(players, eq(matchPlayers.playerId, players.id))
    .where(and(eq(matchPlayers.matchId, matchId), eq(matchPlayers.team, team)))
    .orderBy(desc(players.score));
}

