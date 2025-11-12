"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { matchAwards, matchPlayers, matches, players } from "@/lib/db/schema";
import { playerBucket, supabaseAdmin } from "@/lib/supabase/server";
import { eq, inArray, sql } from "drizzle-orm";

const createPlayerSchema = z.object({
  name: z.string().min(2, "O nome precisa de pelo menos 2 caracteres"),
  score: z.coerce.number().min(0).default(0),
});

const updateScoreSchema = z.object({
  playerId: z.number().int().positive(),
  score: z.number().min(0),
  revalidatePaths: z.array(z.string()).optional(),
});

const createMatchSchema = z.object({
  playerIds: z.array(z.number().int().positive()).length(10),
});

const completeMatchSchema = z.object({
  matchId: z.number().int().positive(),
  winnerTeam: z.union([z.literal(1), z.literal(2)]),
  mvpPlayerId: z.number().int().positive(),
  dudPlayerId: z.number().int().positive(),
});

export async function createPlayerAction(formData: FormData) {
  const parsed = createPlayerSchema.safeParse({
    name: formData.get("name"),
    score: formData.get("score") ?? "0",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");
  }

  let photoUrl: string | null = null;
  const file = formData.get("photo");

  if (file && file instanceof File && file.size > 0) {
    const extension = file.name.split(".").pop() ?? "png";
    const filePath = `players/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabaseAdmin.storage
      .from(playerBucket)
      .upload(filePath, await file.arrayBuffer(), {
        upsert: true,
        contentType: file.type || "image/png",
      });

    if (error) {
      throw new Error(
        `Erro ao enviar a foto do jogador: ${error.message ?? "desconhecido"}`
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(playerBucket)
      .getPublicUrl(filePath);

    photoUrl = publicUrlData.publicUrl;
  }

  const [{ nextId }] = await db
    .select({ nextId: sql<number>`COALESCE(MAX(${players.id}), 0) + 1` })
    .from(players);

  await db.insert(players).values({
    id: nextId ?? 1,
    name: parsed.data.name,
    score: parsed.data.score,
    photoUrl,
  });

  revalidatePath("/players");
}

export async function updatePlayerScoreAction(input: unknown) {
  const parsed = updateScoreSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");
  }

  await db
    .update(players)
    .set({ score: parsed.data.score })
    .where(eq(players.id, parsed.data.playerId));

  const paths = parsed.data.revalidatePaths ?? [];
  const unique = Array.from(new Set(["/players", ...paths]));
  unique.forEach((path) => {
    revalidatePath(path);
  });
}

function shuffle<T>(items: T[]) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function createMatchAction(input: unknown) {
  const parsed = createMatchSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Seleção inválida");
  }

  const shuffled = shuffle(parsed.data.playerIds);
  const teamOne = shuffled.slice(0, 5);
  const teamTwo = shuffled.slice(5, 10);

  const [match] = await db
    .insert(matches)
    .values({})
    .returning({ id: matches.id });

  const entries = [...teamOne, ...teamTwo].map((playerId, index) => ({
    matchId: match.id,
    playerId,
    team: index < 5 ? 1 : 2,
  }));

  await db.insert(matchPlayers).values(entries);

  revalidatePath(`/match/${match.id}`);

  return { matchId: match.id, teamOne, teamTwo };
}

export async function completeMatchAction(input: unknown) {
  const parsed = completeMatchSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");
  }

  const { matchId, winnerTeam, mvpPlayerId, dudPlayerId } = parsed.data;

  if (mvpPlayerId === dudPlayerId) {
    throw new Error("O MVP e o pior jogador não podem ser a mesma pessoa.");
  }

  const matchRecord = await db
    .select({
      id: matches.id,
      winnerTeam: matches.winnerTeam,
    })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (matchRecord.length === 0) {
    throw new Error("Partida não encontrada.");
  }

  if (matchRecord[0]?.winnerTeam) {
    throw new Error("Esta partida já foi encerrada.");
  }

  const matchPlayersRows = await db
    .select({
      playerId: matchPlayers.playerId,
      team: matchPlayers.team,
    })
    .from(matchPlayers)
    .where(eq(matchPlayers.matchId, matchId));

  if (matchPlayersRows.length !== 10) {
    throw new Error("Partida inválida: jogadores insuficientes.");
  }

  const winners = matchPlayersRows
    .filter((row) => row.team === winnerTeam)
    .map((row) => row.playerId);

  if (winners.length !== 5) {
    throw new Error("Time vencedor precisa ter 5 jogadores.");
  }

  if (!winners.includes(mvpPlayerId)) {
    throw new Error("MVP precisa pertencer ao time vencedor.");
  }

  const loserTeam = winnerTeam === 1 ? 2 : 1;
  const losers = matchPlayersRows
    .filter((row) => row.team === loserTeam)
    .map((row) => row.playerId);

  if (losers.length !== 5) {
    throw new Error("Time perdedor precisa ter 5 jogadores.");
  }

  if (!losers.includes(dudPlayerId)) {
    throw new Error("O pior jogador precisa ser do time perdedor.");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(matches)
      .set({
        winnerTeam,
        completedAt: new Date(),
      })
      .where(eq(matches.id, matchId));

    await tx.delete(matchAwards).where(eq(matchAwards.matchId, matchId));
    await tx.insert(matchAwards).values([
      { matchId, playerId: mvpPlayerId, awardType: "mvp" },
      { matchId, playerId: dudPlayerId, awardType: "dud" },
    ]);

    const uniqueWinners = Array.from(new Set(winners));
    const uniqueLosers = Array.from(new Set(losers));

    if (uniqueWinners.length > 0) {
      await tx
        .update(players)
        .set({ score: sql`${players.score} + 25` })
        .where(inArray(players.id, uniqueWinners));
    }

    if (uniqueLosers.length > 0) {
      await tx
        .update(players)
        .set({ score: sql`${players.score} - 25` })
        .where(inArray(players.id, uniqueLosers));
    }

    await tx
      .update(players)
      .set({ score: sql`${players.score} + 10` })
      .where(eq(players.id, mvpPlayerId));

    await tx
      .update(players)
      .set({ score: sql`${players.score} - 10` })
      .where(eq(players.id, dudPlayerId));
  });

  revalidatePath("/players");
  revalidatePath(`/match/${matchId}`);
}
