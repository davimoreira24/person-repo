import { and, asc, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  gameCards,
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

export type PlayerCareerStats = {
  wins: number;
  losses: number;
  mvpCount: number;
  dudCount: number;
};

const emptyCareerStats = (): PlayerCareerStats => ({
  wins: 0,
  losses: 0,
  mvpCount: 0,
  dudCount: 0,
});

/** Vitórias/derrotas em partidas com `winner_team` definido; MVPs e piores via `match_awards`. */
export async function getPlayerCareerStatsMap(): Promise<
  Map<number, PlayerCareerStats>
> {
  const matchPartRows = await db
    .select({
      playerId: matchPlayers.playerId,
      team: matchPlayers.team,
      winnerTeam: matches.winnerTeam,
    })
    .from(matchPlayers)
    .innerJoin(matches, eq(matchPlayers.matchId, matches.id))
    .where(isNotNull(matches.winnerTeam));

  const stats = new Map<number, PlayerCareerStats>();

  const touch = (playerId: number): PlayerCareerStats => {
    let row = stats.get(playerId);
    if (!row) {
      row = emptyCareerStats();
      stats.set(playerId, row);
    }
    return row;
  };

  for (const row of matchPartRows) {
    const s = touch(row.playerId);
    const wt = row.winnerTeam as 1 | 2;
    if (row.team === wt) {
      s.wins += 1;
    } else {
      s.losses += 1;
    }
  }

  const awardRows = await db
    .select({
      playerId: matchAwards.playerId,
      awardType: matchAwards.awardType,
    })
    .from(matchAwards)
    .innerJoin(matches, eq(matchAwards.matchId, matches.id))
    .where(isNotNull(matches.winnerTeam));

  for (const row of awardRows) {
    const s = touch(row.playerId);
    if (row.awardType === "mvp") {
      s.mvpCount += 1;
    } else if (row.awardType === "dud") {
      s.dudCount += 1;
    }
  }

  return stats;
}

/**
 * Vitórias e derrotas consecutivas (partidas encerradas, mais recente primeiro;
 * cada sequência para no primeiro resultado oposto).
 */
export async function getCurrentWinAndLossStreakByPlayerIds(
  playerIds: number[],
): Promise<{ wins: Map<number, number>; losses: Map<number, number> }> {
  const wins = new Map<number, number>();
  const losses = new Map<number, number>();
  for (const id of playerIds) {
    wins.set(id, 0);
    losses.set(id, 0);
  }
  if (playerIds.length === 0) {
    return { wins, losses };
  }

  const rows = await db
    .select({
      playerId: matchPlayers.playerId,
      team: matchPlayers.team,
      winnerTeam: matches.winnerTeam,
      completedAt: matches.completedAt,
      matchId: matches.id,
    })
    .from(matchPlayers)
    .innerJoin(matches, eq(matchPlayers.matchId, matches.id))
    .where(
      and(
        inArray(matchPlayers.playerId, playerIds),
        isNotNull(matches.winnerTeam),
        isNotNull(matches.completedAt),
      ),
    );

  type Row = (typeof rows)[number];
  const byPlayer = new Map<number, Row[]>();
  for (const r of rows) {
    const list = byPlayer.get(r.playerId) ?? [];
    list.push(r);
    byPlayer.set(r.playerId, list);
  }

  const compareRecent = (a: Row, b: Row) => {
    const ca = a.completedAt!.getTime();
    const cb = b.completedAt!.getTime();
    if (cb !== ca) return cb - ca;
    return b.matchId - a.matchId;
  };

  for (const [playerId, list] of byPlayer) {
    list.sort(compareRecent);
    let winStreak = 0;
    for (const m of list) {
      const wt = m.winnerTeam as 1 | 2;
      const won = m.team === wt;
      if (won) {
        winStreak += 1;
      } else {
        break;
      }
    }
    wins.set(playerId, winStreak);

    let lossStreak = 0;
    for (const m of list) {
      const wt = m.winnerTeam as 1 | 2;
      const won = m.team === wt;
      if (!won) {
        lossStreak += 1;
      } else {
        break;
      }
    }
    losses.set(playerId, lossStreak);
  }

  return { wins, losses };
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
  championKey: string | null;
  championName: string | null;
  /** Vitórias seguidas (partidas encerradas), mais recente primeiro. */
  winStreak: number;
  /** Derrotas seguidas (partidas encerradas), mais recente primeiro. */
  lossStreak: number;
};

export type MatchSelectedCard = {
  id: number;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
};

export interface MatchWithTeams {
  id: number;
  createdAt: Date | null;
  completedAt: Date | null;
  winnerTeam: 1 | 2 | null;
  gameMode: string;
  /** Regra "Campeões aleatórios" (nova). Se for partida legada `random_champions`, vem true também. */
  championsRandom: boolean;
  /** Cartinha sorteada para esta partida (se a lobby tinha “cartas ativas”). */
  selectedCard: MatchSelectedCard | null;
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
      gameMode: matches.gameMode,
      championsRandom: matches.championsRandom,
      selectedGameCardId: matches.selectedGameCardId,
      cardSlug: gameCards.slug,
      cardTitle: gameCards.title,
      cardDescription: gameCards.description,
      cardImageUrl: gameCards.imageUrl,
      playerId: players.id,
      name: players.name,
      photoUrl: players.photoUrl,
      score: players.score,
      team: matchPlayers.team,
      matchPlayerId: matchPlayers.id,
      championKey: matchPlayers.championKey,
      championName: matchPlayers.championName,
    })
    .from(matches)
    .leftJoin(gameCards, eq(matches.selectedGameCardId, gameCards.id))
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

  const selectedCard: MatchSelectedCard | null =
    matchInfo.selectedGameCardId != null &&
    matchInfo.cardSlug != null &&
    matchInfo.cardTitle != null
      ? {
          id: matchInfo.selectedGameCardId,
          slug: matchInfo.cardSlug,
          title: matchInfo.cardTitle,
          description: matchInfo.cardDescription ?? "",
          imageUrl: matchInfo.cardImageUrl ?? null,
        }
      : null;

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
      championKey: row.championKey ?? null,
      championName: row.championName ?? null,
      winStreak: 0,
      lossStreak: 0,
    });
  });

  const gameMode = matchInfo.gameMode ?? "classic";
  return {
    id: matchInfo.matchId,
    createdAt: matchInfo.createdAt,
    completedAt: matchInfo.completedAt,
    winnerTeam,
    gameMode,
    championsRandom:
      matchInfo.championsRandom === true || gameMode === "random_champions",
    selectedCard,
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

export type MatchHistoryEntry = {
  id: number;
  completedAt: Date | null;
  winnerTeam: 1 | 2;
  gameMode: string;
  championsRandom: boolean;
  mvpName: string | null;
  dudName: string | null;
  team1Names: string[];
  team2Names: string[];
};

/** Partidas encerradas (com vencedor), mais recentes primeiro. */
export async function getCompletedMatchesHistory(
  limit = 200,
): Promise<MatchHistoryEntry[]> {
  const completed = await db
    .select({
      id: matches.id,
      completedAt: matches.completedAt,
      winnerTeam: matches.winnerTeam,
      gameMode: matches.gameMode,
      championsRandom: matches.championsRandom,
    })
    .from(matches)
    .where(isNotNull(matches.winnerTeam))
    .orderBy(desc(matches.completedAt))
    .limit(limit);

  if (completed.length === 0) {
    return [];
  }

  const ids = completed.map((m) => m.id);

  const awardRows = await db
    .select({
      matchId: matchAwards.matchId,
      awardType: matchAwards.awardType,
      name: players.name,
    })
    .from(matchAwards)
    .innerJoin(players, eq(matchAwards.playerId, players.id))
    .where(inArray(matchAwards.matchId, ids));

  const mpRows = await db
    .select({
      matchId: matchPlayers.matchId,
      team: matchPlayers.team,
      name: players.name,
    })
    .from(matchPlayers)
    .innerJoin(players, eq(matchPlayers.playerId, players.id))
    .where(inArray(matchPlayers.matchId, ids))
    .orderBy(asc(matchPlayers.id));

  const awardsByMatch = new Map<
    number,
    { mvp: string | null; dud: string | null }
  >();
  for (const id of ids) {
    awardsByMatch.set(id, { mvp: null, dud: null });
  }
  for (const row of awardRows) {
    const a = awardsByMatch.get(row.matchId);
    if (!a) continue;
    if (row.awardType === "mvp") {
      a.mvp = row.name;
    }
    if (row.awardType === "dud") {
      a.dud = row.name;
    }
  }

  const teamsByMatch = new Map<number, { 1: string[]; 2: string[] }>();
  for (const id of ids) {
    teamsByMatch.set(id, { 1: [], 2: [] });
  }
  for (const row of mpRows) {
    const t = teamsByMatch.get(row.matchId);
    if (!t) continue;
    const teamNum = row.team as 1 | 2;
    t[teamNum].push(row.name);
  }

  return completed.map((m) => {
    const wt = m.winnerTeam as 1 | 2;
    const awards = awardsByMatch.get(m.id);
    const teams = teamsByMatch.get(m.id);
    const gameMode = m.gameMode ?? "classic";
    return {
      id: m.id,
      completedAt: m.completedAt,
      winnerTeam: wt,
      gameMode,
      championsRandom:
        m.championsRandom === true || gameMode === "random_champions",
      mvpName: awards?.mvp ?? null,
      dudName: awards?.dud ?? null,
      team1Names: teams?.[1] ?? [],
      team2Names: teams?.[2] ?? [],
    };
  });
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

