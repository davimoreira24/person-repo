import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  gameCards,
  matchPlayers,
  matches,
  players,
} from "@/lib/db/schema";
import type { MatchSelectedCard } from "@/lib/queries/players";

export type PreMatchPlayer = {
  playerId: number;
  name: string;
  photoUrl: string | null;
  team: 1 | 2;
  laneIndex: number;
  laneLabel: string;
  bravura: boolean;
  championKey: string | null;
  championName: string | null;
};

export type PreMatchLoadout = {
  matchId: number;
  gameMode: string;
  championsRandom: boolean;
  loadoutCompletedAt: Date | null;
  selectedCard: MatchSelectedCard | null;
  teams: {
    1: PreMatchPlayer[];
    2: PreMatchPlayer[];
  };
};

const LANE_LABELS = ["Topo", "Selva", "Meio", "Atirador", "Suporte"] as const;

export async function getPreMatchLoadout(
  matchId: number,
): Promise<PreMatchLoadout | null> {
  const rows = await db
    .select({
      matchId: matches.id,
      gameMode: matches.gameMode,
      championsRandom: matches.championsRandom,
      loadoutCompletedAt: matches.loadoutCompletedAt,
      winnerTeam: matches.winnerTeam,
      selectedGameCardId: matches.selectedGameCardId,
      cardSlug: gameCards.slug,
      cardTitle: gameCards.title,
      cardDescription: gameCards.description,
      cardImageUrl: gameCards.imageUrl,
      playerId: players.id,
      name: players.name,
      photoUrl: players.photoUrl,
      team: matchPlayers.team,
      bravura: matchPlayers.bravura,
      championKey: matchPlayers.championKey,
      championName: matchPlayers.championName,
      matchPlayerRowId: matchPlayers.id,
    })
    .from(matches)
    .leftJoin(gameCards, eq(matches.selectedGameCardId, gameCards.id))
    .leftJoin(matchPlayers, eq(matchPlayers.matchId, matches.id))
    .leftJoin(players, eq(matchPlayers.playerId, players.id))
    .where(eq(matches.id, matchId))
    .orderBy(asc(matchPlayers.id));

  if (rows.length === 0) {
    return null;
  }

  const head = rows[0]!;
  const gameMode = head.gameMode ?? "classic";

  const selectedCard: MatchSelectedCard | null =
    head.selectedGameCardId != null &&
    head.cardSlug != null &&
    head.cardTitle != null
      ? {
          id: head.selectedGameCardId,
          slug: head.cardSlug,
          title: head.cardTitle,
          description: head.cardDescription ?? "",
          imageUrl: head.cardImageUrl ?? null,
        }
      : null;

  const teams: PreMatchLoadout["teams"] = { 1: [], 2: [] };
  let slotInTeam = { 1: 0, 2: 0 };

  for (const row of rows) {
    if (!row.playerId || !row.team) continue;
    const team = row.team as 1 | 2;
    const laneIndex = slotInTeam[team];
    slotInTeam[team] += 1;

    teams[team].push({
      playerId: row.playerId,
      name: row.name ?? "Jogador",
      photoUrl: row.photoUrl ?? null,
      team,
      laneIndex,
      laneLabel: LANE_LABELS[laneIndex] ?? "Rota",
      bravura: row.bravura === true,
      championKey: row.championKey ?? null,
      championName: row.championName ?? null,
    });
  }

  return {
    matchId: head.matchId,
    gameMode,
    championsRandom:
      head.championsRandom === true || gameMode === "random_champions",
    loadoutCompletedAt: head.loadoutCompletedAt,
    selectedCard,
    teams,
  };
}
