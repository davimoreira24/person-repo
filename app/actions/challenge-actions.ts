"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchPlayers, matches } from "@/lib/db/schema";
import {
  buildChallengeDiscordMessageForMatch,
  getChallengeStatus,
} from "@/lib/queries/challenge";

const setChallengeSchema = z.object({
  token: z.string().uuid(),
  active: z.boolean(),
});

export async function setChallengeAction(input: unknown): Promise<{
  challengeActive: boolean;
}> {
  const parsed = setChallengeSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");
  }

  const { token, active } = parsed.data;

  const [row] = await db
    .select({
      id: matchPlayers.id,
      matchId: matchPlayers.matchId,
      loadoutCompletedAt: matches.loadoutCompletedAt,
      winnerTeam: matches.winnerTeam,
    })
    .from(matchPlayers)
    .innerJoin(matches, eq(matchPlayers.matchId, matches.id))
    .where(eq(matchPlayers.challengeToken, token))
    .limit(1);

  if (!row) {
    throw new Error("Link de desafio inválido ou expirado.");
  }

  if (row.loadoutCompletedAt != null || row.winnerTeam != null) {
    throw new Error("Desafios já foram confirmados para esta partida.");
  }

  await db
    .update(matchPlayers)
    .set({ challengeActive: active })
    .where(eq(matchPlayers.id, row.id));

  revalidatePath(`/match/${row.matchId}/pre-partida`);
  revalidatePath(`/match/${row.matchId}/d/${token}`);

  return { challengeActive: active };
}

export async function getChallengeStatusAction(matchId: number) {
  return getChallengeStatus(matchId);
}

const discordMessageSchema = z.object({
  matchId: z.number().int().positive(),
  origin: z.string().min(1),
});

export async function buildDiscordChallengeMessageAction(
  input: unknown,
): Promise<{ message: string }> {
  const parsed = discordMessageSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");
  }

  const message = await buildChallengeDiscordMessageForMatch(
    parsed.data.matchId,
    parsed.data.origin,
  );

  if (!message) {
    throw new Error("Partida não encontrada.");
  }

  return { message };
}
