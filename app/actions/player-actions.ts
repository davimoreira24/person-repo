"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { matchAwards, matchPlayers, matches, players } from "@/lib/db/schema";
import {
  fetchChampionCatalog,
  pickRandomChampionsForMatch,
} from "@/lib/lol/meraki-champions";
import { playerBucket, supabaseAdmin } from "@/lib/supabase/server";
import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import {
  MATCH_GAME_CLASSIC,
  MATCH_GAME_DRAFT,
  MATCH_GAME_RANDOM_CHAMPIONS,
} from "@/lib/match-game-mode";
import { partitionTenPlayersByScore } from "@/lib/matchmaking/balance-teams";
import { assignTeamLaneOrderAvoidingRepeat } from "@/lib/matchmaking/improved-lanes";
import { shuffle } from "@/lib/matchmaking/shuffle-crypto";
import { getLastLaneIndexByPlayerId } from "@/lib/queries/last-lane";
import {
  buildCardRevealPayload,
  pickRandomActiveGameCard,
  type CardRevealPayload,
} from "@/lib/queries/game-cards";
import { isRandomOnlyLobbyPeriod } from "@/lib/random-only-lobby-window";

const createPlayerSchema = z.object({
  name: z.string().min(2, "O nome precisa de pelo menos 2 caracteres"),
  score: z.coerce.number().min(0).default(0),
});

const updateScoreSchema = z.object({
  playerId: z.number().int().positive(),
  score: z.number().min(0),
  revalidatePaths: z.array(z.string()).optional(),
});

const createMatchInputSchema = z.object({
  playerIds: z
    .array(z.number().int().positive())
    .length(10)
    .refine((ids) => new Set(ids).size === 10, "Dez jogadores distintos são obrigatórios."),
  balanceTeams: z.boolean().optional(),
  improvedLanes: z.boolean().optional(),
  /** Sorteia uma cartinha de regra (tabela `game_cards`). */
  cartasAtivas: z.boolean().optional(),
  /** Regra: sorteia 1 campeão por rota (Meraki). */
  championsRandom: z.boolean().optional(),
});

const teamFiveSchema = z
  .array(z.number().int().positive())
  .length(5)
  .refine((ids) => new Set(ids).size === 5, "Cinco jogadores distintos por time.");

const createDraftMatchInputSchema = z.object({
  teamOneIds: teamFiveSchema,
  teamTwoIds: teamFiveSchema,
  captainOneId: z.number().int().positive(),
  captainTwoId: z.number().int().positive(),
  improvedLanes: z.boolean().optional(),
  cartasAtivas: z.boolean().optional(),
  championsRandom: z.boolean().optional(),
});

const completeMatchSchema = z.object({
  matchId: z.number().int().positive(),
  winnerTeam: z.union([z.literal(1), z.literal(2)]),
  mvpPlayerId: z.number().int().positive(),
  dudPlayerId: z.number().int().positive(),
});

const replayMatchInputSchema = z.object({
  matchId: z.number().int().positive(),
  balanceTeams: z.boolean().optional(),
  improvedLanes: z.boolean().optional(),
  cartasAtivas: z.boolean().optional(),
  championsRandom: z.boolean().optional(),
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
  revalidatePath("/ranking");
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
  const unique = Array.from(new Set(["/players", "/ranking", ...paths]));
  unique.forEach((path) => {
    revalidatePath(path);
  });
}

async function buildShuffledTeams(
  playerIds: number[],
  balanceTeams: boolean,
  improvedLanes: boolean,
): Promise<{ teamOneShuffled: number[]; teamTwoShuffled: number[] }> {
  let teamOne: number[];
  let teamTwo: number[];

  if (!balanceTeams) {
    const shuffled = shuffle(playerIds);
    teamOne = shuffled.slice(0, 5);
    teamTwo = shuffled.slice(5, 10);
  } else {
    const scoreRows = await db
      .select({ id: players.id, score: players.score })
      .from(players)
      .where(inArray(players.id, playerIds));

    if (scoreRows.length !== 10) {
      throw new Error("Não foi possível carregar as pontuações dos 10 jogadores.");
    }

    const scoreMap = new Map(scoreRows.map((r) => [r.id, r.score]));
    const ordered = playerIds.map((id) => ({
      id,
      score: scoreMap.get(id) ?? 0,
    }));
    const split = partitionTenPlayersByScore(ordered);
    teamOne = split.team1;
    teamTwo = split.team2;
  }

  if (!improvedLanes) {
    return {
      teamOneShuffled: shuffle(teamOne),
      teamTwoShuffled: shuffle(teamTwo),
    };
  }

  const lastLanes = await getLastLaneIndexByPlayerId(playerIds);
  return {
    teamOneShuffled: assignTeamLaneOrderAvoidingRepeat(teamOne, lastLanes),
    teamTwoShuffled: assignTeamLaneOrderAvoidingRepeat(teamTwo, lastLanes),
  };
}

export async function createMatchAction(input: unknown) {
  const parsed = createMatchInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Seleção inválida");
  }

  const championsRandom = parsed.data.championsRandom === true;

  if (isRandomOnlyLobbyPeriod() && !championsRandom) {
    throw new Error(
      "Neste fim de semana (10–12 abr 2026) o clássico só roda com a regra 'Campeões aleatórios'. Ligue a regra em Condições ou use o modo Draft.",
    );
  }

  const balanceTeams = parsed.data.balanceTeams === true;
  const improvedLanes = parsed.data.improvedLanes === true;
  const cartasAtivas = parsed.data.cartasAtivas === true;
  const { teamOneShuffled, teamTwoShuffled } = await buildShuffledTeams(
    parsed.data.playerIds,
    balanceTeams,
    improvedLanes,
  );

  let selectedGameCardId: number | null = null;
  let cardReveal: CardRevealPayload | null = null;
  if (cartasAtivas) {
    const picked = await pickRandomActiveGameCard();
    if (!picked) {
      throw new Error(
        "Cartas ativas ligadas, mas não há cartas no banco (ou todas inativas). Cadastre em game_cards (Supabase).",
      );
    }
    selectedGameCardId = picked.id;
    cardReveal = await buildCardRevealPayload(picked);
  }

  const [match] = await db
    .insert(matches)
    .values({
      gameMode: MATCH_GAME_CLASSIC,
      championsRandom,
      selectedGameCardId,
    })
    .returning({ id: matches.id });

  const orderedIds = [...teamOneShuffled, ...teamTwoShuffled];
  const championAssignments = championsRandom
    ? pickRandomChampionsForMatch(await fetchChampionCatalog())
    : null;

  const entries = orderedIds.map((playerId, index) => ({
    matchId: match.id,
    playerId,
    team: index < 5 ? 1 : 2,
    championKey: championAssignments ? championAssignments[index]!.key : null,
    championName: championAssignments
      ? championAssignments[index]!.name
      : null,
  }));

  await db.insert(matchPlayers).values(entries);

  revalidatePath(`/match/${match.id}`);
  if (championsRandom) {
    revalidatePath("/analytics/campeoes");
  }

  return {
    matchId: match.id,
    teamOne: teamOneShuffled,
    teamTwo: teamTwoShuffled,
    cardReveal,
  };
}

/** Compat: alias para callers antigos que ainda chamam `createRandomMatchAction`. */
export async function createRandomMatchAction(input: unknown) {
  if (input && typeof input === "object") {
    return createMatchAction({ ...(input as object), championsRandom: true });
  }
  return createMatchAction({ championsRandom: true });
}

/**
 * Cria uma partida no modo Draft: os times já vêm decididos pelos capitães.
 * As lanes são sorteadas dentro de cada time (com ou sem "Lanes melhoradas").
 * `championsRandom` continua opcional (regra independente).
 */
export async function createDraftMatchAction(input: unknown) {
  const parsed = createDraftMatchInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Draft inválido");
  }

  const {
    teamOneIds,
    teamTwoIds,
    captainOneId,
    captainTwoId,
  } = parsed.data;

  const allIds = [...teamOneIds, ...teamTwoIds];
  if (new Set(allIds).size !== 10) {
    throw new Error("Os 10 jogadores precisam ser distintos entre os dois times.");
  }
  if (!teamOneIds.includes(captainOneId)) {
    throw new Error("Capitão 1 precisa estar no time 1.");
  }
  if (!teamTwoIds.includes(captainTwoId)) {
    throw new Error("Capitão 2 precisa estar no time 2.");
  }

  const improvedLanes = parsed.data.improvedLanes === true;
  const cartasAtivas = parsed.data.cartasAtivas === true;
  const championsRandom = parsed.data.championsRandom === true;

  let teamOneOrdered: number[];
  let teamTwoOrdered: number[];

  if (improvedLanes) {
    const lastLanes = await getLastLaneIndexByPlayerId(allIds);
    teamOneOrdered = assignTeamLaneOrderAvoidingRepeat(teamOneIds, lastLanes);
    teamTwoOrdered = assignTeamLaneOrderAvoidingRepeat(teamTwoIds, lastLanes);
  } else {
    teamOneOrdered = shuffle([...teamOneIds]);
    teamTwoOrdered = shuffle([...teamTwoIds]);
  }

  let selectedGameCardId: number | null = null;
  let cardReveal: CardRevealPayload | null = null;
  if (cartasAtivas) {
    const picked = await pickRandomActiveGameCard();
    if (!picked) {
      throw new Error(
        "Cartas ativas ligadas, mas não há cartas no banco (ou todas inativas). Cadastre em game_cards (Supabase).",
      );
    }
    selectedGameCardId = picked.id;
    cardReveal = await buildCardRevealPayload(picked);
  }

  const [match] = await db
    .insert(matches)
    .values({
      gameMode: MATCH_GAME_DRAFT,
      championsRandom,
      selectedGameCardId,
    })
    .returning({ id: matches.id });

  const orderedIds = [...teamOneOrdered, ...teamTwoOrdered];
  const championAssignments = championsRandom
    ? pickRandomChampionsForMatch(await fetchChampionCatalog())
    : null;

  const entries = orderedIds.map((playerId, index) => ({
    matchId: match.id,
    playerId,
    team: index < 5 ? 1 : 2,
    championKey: championAssignments ? championAssignments[index]!.key : null,
    championName: championAssignments
      ? championAssignments[index]!.name
      : null,
  }));

  await db.insert(matchPlayers).values(entries);

  revalidatePath(`/match/${match.id}`);
  if (championsRandom) {
    revalidatePath("/analytics/campeoes");
  }

  return {
    matchId: match.id,
    teamOne: teamOneOrdered,
    teamTwo: teamTwoOrdered,
    captainOneId,
    captainTwoId,
    cardReveal,
  };
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
  revalidatePath("/ranking");
  revalidatePath("/historico");
  revalidatePath("/analytics/campeoes");

  const ranking = await db
    .select({
      id: players.id,
      name: players.name,
      score: players.score,
      photoUrl: players.photoUrl,
    })
    .from(players)
    .orderBy(desc(players.score), asc(players.name));

  return {
    ranking,
    winnerTeam,
    winnerPlayerIds: winners,
    loserPlayerIds: losers,
    mvpPlayerId,
    dudPlayerId,
  };
}

export async function replayMatchAction(input: unknown) {
  const parsed = replayMatchInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos para re-jogar.");
  }

  const { matchId } = parsed.data;
  const balanceTeams = parsed.data.balanceTeams === true;
  const improvedLanes = parsed.data.improvedLanes === true;
  const cartasAtivas = parsed.data.cartasAtivas === true;

  const existingRows = await db
    .select({ id: matches.id, gameMode: matches.gameMode })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (existingRows.length === 0) {
    throw new Error("Partida não encontrada para re-jogar.");
  }

  const championsRandom = parsed.data.championsRandom === true;
  const sourceGameMode = existingRows[0]!.gameMode;
  const isDraftSource = sourceGameMode === MATCH_GAME_DRAFT;

  const playerRows = await db
    .select({ playerId: matchPlayers.playerId, team: matchPlayers.team })
    .from(matchPlayers)
    .where(eq(matchPlayers.matchId, matchId))
    .orderBy(asc(matchPlayers.id));

  if (playerRows.length !== 10) {
    throw new Error("Partida anterior não possui 10 jogadores cadastrados.");
  }

  const playerIds = playerRows.map((row) => row.playerId);

  let teamOneOrdered: number[];
  let teamTwoOrdered: number[];

  if (isDraftSource) {
    const team1Ids = playerRows
      .filter((r) => r.team === 1)
      .map((r) => r.playerId);
    const team2Ids = playerRows
      .filter((r) => r.team === 2)
      .map((r) => r.playerId);
    if (team1Ids.length !== 5 || team2Ids.length !== 5) {
      throw new Error("Partida draft anterior está com times inconsistentes.");
    }
    if (improvedLanes) {
      const lastLanes = await getLastLaneIndexByPlayerId(playerIds);
      teamOneOrdered = assignTeamLaneOrderAvoidingRepeat(team1Ids, lastLanes);
      teamTwoOrdered = assignTeamLaneOrderAvoidingRepeat(team2Ids, lastLanes);
    } else {
      teamOneOrdered = shuffle([...team1Ids]);
      teamTwoOrdered = shuffle([...team2Ids]);
    }
  } else {
    if (isRandomOnlyLobbyPeriod() && !championsRandom) {
      throw new Error(
        "Neste fim de semana o clássico só roda com 'Campeões aleatórios'. Ligue a regra em Condições.",
      );
    }
    const built = await buildShuffledTeams(playerIds, balanceTeams, improvedLanes);
    teamOneOrdered = built.teamOneShuffled;
    teamTwoOrdered = built.teamTwoShuffled;
  }

  let selectedGameCardId: number | null = null;
  let cardReveal: CardRevealPayload | null = null;
  if (cartasAtivas) {
    const picked = await pickRandomActiveGameCard();
    if (!picked) {
      throw new Error(
        "Cartas ativas ligadas, mas não há cartas no banco (ou todas inativas). Cadastre em game_cards (Supabase).",
      );
    }
    selectedGameCardId = picked.id;
    cardReveal = await buildCardRevealPayload(picked);
  }

  const [newMatch] = await db
    .insert(matches)
    .values({
      gameMode: isDraftSource ? MATCH_GAME_DRAFT : MATCH_GAME_CLASSIC,
      championsRandom,
      selectedGameCardId,
    })
    .returning({ id: matches.id });

  const orderedIds = [...teamOneOrdered, ...teamTwoOrdered];
  const championAssignments = championsRandom
    ? pickRandomChampionsForMatch(await fetchChampionCatalog())
    : null;

  const entries = orderedIds.map((playerId, index) => ({
    matchId: newMatch.id,
    playerId,
    team: index < 5 ? 1 : 2,
    championKey: championAssignments ? championAssignments[index]!.key : null,
    championName: championAssignments
      ? championAssignments[index]!.name
      : null,
  }));

  await db.insert(matchPlayers).values(entries);

  revalidatePath(`/match/${newMatch.id}`);
  revalidatePath("/players");
  if (championsRandom) {
    revalidatePath("/analytics/campeoes");
  }

  return { matchId: newMatch.id, cardReveal };
}
