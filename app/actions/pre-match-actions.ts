"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchPlayers, matches, players } from "@/lib/db/schema";
import {
  assignBravuraChampionsBySlotIndex,
  fetchChampionCatalog,
} from "@/lib/lol/meraki-champions";

const finalizeLoadoutSchema = z.object({
  matchId: z.number().int().positive(),
  bravuraPlayerIds: z.array(z.number().int().positive()).max(10),
});

export type BravuraRevealRow = {
  playerId: number;
  playerName: string;
  championKey: string;
  championName: string;
};

export async function finalizePreMatchLoadoutAction(input: unknown): Promise<{
  revealed: BravuraRevealRow[];
}> {
  const parsed = finalizeLoadoutSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Loadout inválido");
  }

  const { matchId, bravuraPlayerIds } = parsed.data;

  const [matchRow] = await db
    .select({
      id: matches.id,
      winnerTeam: matches.winnerTeam,
      championsRandom: matches.championsRandom,
      loadoutCompletedAt: matches.loadoutCompletedAt,
    })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!matchRow) {
    throw new Error("Partida não encontrada.");
  }
  if (matchRow.winnerTeam) {
    throw new Error("Partida já encerrada.");
  }
  if (matchRow.loadoutCompletedAt) {
    throw new Error("Pré-partida já foi confirmada.");
  }

  const rows = await db
    .select({
      id: matchPlayers.id,
      playerId: matchPlayers.playerId,
      championKey: matchPlayers.championKey,
    })
    .from(matchPlayers)
    .where(eq(matchPlayers.matchId, matchId))
    .orderBy(asc(matchPlayers.id));

  if (rows.length !== 10) {
    throw new Error("Partida inválida: são necessários 10 jogadores.");
  }

  const playerIdsInMatch = new Set(rows.map((r) => r.playerId));
  const bravuraSet = new Set<number>();

  if (matchRow.championsRandom) {
    if (bravuraPlayerIds.length > 0) {
      throw new Error(
        "Com 'Campeões aleatórios' ligado na lobby, Bravura não se aplica.",
      );
    }
  } else {
    for (const pid of bravuraPlayerIds) {
      if (!playerIdsInMatch.has(pid)) {
        throw new Error("Jogador inválido para Bravura nesta partida.");
      }
      bravuraSet.add(pid);
    }
  }

  const slotIndexes: number[] = [];
  const existingKeys: (string | null)[] = rows.map((r) => r.championKey);

  rows.forEach((row, slotIndex) => {
    if (bravuraSet.has(row.playerId)) {
      slotIndexes.push(slotIndex);
    }
  });

  const catalog = await fetchChampionCatalog();
  const assignments =
    slotIndexes.length > 0
      ? assignBravuraChampionsBySlotIndex(catalog, slotIndexes, existingKeys)
      : new Map<number, { key: string; name: string }>();

  await db.transaction(async (tx) => {
    for (let slotIndex = 0; slotIndex < rows.length; slotIndex++) {
      const row = rows[slotIndex]!;
      const isBravura = bravuraSet.has(row.playerId);
      const pick = assignments.get(slotIndex);

      await tx
        .update(matchPlayers)
        .set({
          bravura: isBravura,
          ...(pick
            ? { championKey: pick.key, championName: pick.name }
            : {}),
        })
        .where(eq(matchPlayers.id, row.id));
    }

    await tx
      .update(matches)
      .set({ loadoutCompletedAt: new Date() })
      .where(eq(matches.id, matchId));
  });

  const revealed: BravuraRevealRow[] = [];
  if (bravuraSet.size > 0) {
    const ids = [...bravuraSet];
    const nameRows = await db
      .select({ id: players.id, name: players.name })
      .from(players)
      .where(inArray(players.id, ids));
    const nameMap = new Map(nameRows.map((n) => [n.id, n.name]));

    for (let slotIndex = 0; slotIndex < rows.length; slotIndex++) {
      const row = rows[slotIndex]!;
      const pick = assignments.get(slotIndex);
      if (!bravuraSet.has(row.playerId) || !pick) continue;
      revealed.push({
        playerId: row.playerId,
        playerName: nameMap.get(row.playerId) ?? "Jogador",
        championKey: pick.key,
        championName: pick.name,
      });
    }
  }

  revalidatePath(`/match/${matchId}`);
  revalidatePath(`/match/${matchId}/pre-partida`);
  if (revealed.length > 0) {
    revalidatePath("/analytics/campeoes");
  }

  return { revealed };
}
