"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { votes, votingSessions, matches, matchAwards, players, matchPlayers } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

const createVotingSessionSchema = z.object({
  matchId: z.number(),
  winnerTeam: z.union([z.literal(1), z.literal(2)]),
});

const submitVoteSchema = z.object({
  votingSessionId: z.string().uuid(),
  voterToken: z.string().uuid(),
  mvpPlayerId: z.number(),
  dudPlayerId: z.number(),
});

export async function createVotingSessionAction(input: unknown) {
  const parsed = createVotingSessionSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");
  }

  const { matchId, winnerTeam } = parsed.data;

  // Create voting session
  const [session] = await db
    .insert(votingSessions)
    .values({
      matchId,
      winnerTeam,
      status: "active",
    })
    .returning({ id: votingSessions.id });

  // Update match with voting session ID
  await db
    .update(matches)
    .set({ votingSessionId: session.id })
    .where(eq(matches.id, matchId));

  revalidatePath(`/match/${matchId}`);

  return { sessionId: session.id };
}

export async function submitVoteAction(input: unknown) {
  const parsed = submitVoteSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");
  }

  const { votingSessionId, voterToken, mvpPlayerId, dudPlayerId } = parsed.data;

  // Check if session is still active
  const [session] = await db
    .select()
    .from(votingSessions)
    .where(eq(votingSessions.id, votingSessionId))
    .limit(1);

  if (!session) {
    throw new Error("Sessão de votação não encontrada");
  }

  if (session.status !== "active") {
    throw new Error("Sessão de votação já foi encerrada");
  }

  // Check if voter already voted
  const existingVote = await db
    .select()
    .from(votes)
    .where(
      and(
        eq(votes.votingSessionId, votingSessionId),
        eq(votes.voterToken, voterToken),
      ),
    )
    .limit(1);

  if (existingVote.length > 0) {
    // Update existing vote
    await db
      .update(votes)
      .set({
        mvpPlayerId,
        dudPlayerId,
      })
      .where(eq(votes.id, existingVote[0].id));
  } else {
    // Insert new vote
    await db.insert(votes).values({
      votingSessionId,
      voterToken,
      mvpPlayerId,
      dudPlayerId,
    });
  }

  return { success: true };
}

export async function finalizeVotingAction(votingSessionId: string) {
  // Get session
  const [session] = await db
    .select()
    .from(votingSessions)
    .where(eq(votingSessions.id, votingSessionId))
    .limit(1);

  if (!session) {
    throw new Error("Sessão não encontrada");
  }

  if (session.status === "completed") {
    throw new Error("Sessão já foi finalizada");
  }

  // Get all votes
  const allVotes = await db
    .select()
    .from(votes)
    .where(eq(votes.votingSessionId, votingSessionId));

  if (allVotes.length === 0) {
    throw new Error("Nenhum voto registrado");
  }

  // Count MVP votes
  const mvpCounts = allVotes.reduce(
    (acc, vote) => {
      acc[vote.mvpPlayerId] = (acc[vote.mvpPlayerId] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  // Count DUD votes
  const dudCounts = allVotes.reduce(
    (acc, vote) => {
      acc[vote.dudPlayerId] = (acc[vote.dudPlayerId] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  // Find winners
  const mvpPlayerId = Number(
    Object.entries(mvpCounts).reduce((a, b) => (b[1] > a[1] ? b : a))[0],
  );
  const dudPlayerId = Number(
    Object.entries(dudCounts).reduce((a, b) => (b[1] > a[1] ? b : a))[0],
  );

  // Get match players
  const matchPlayersData = await db
    .select()
    .from(matchPlayers)
    .where(eq(matchPlayers.matchId, session.matchId));

  const winnerPlayers = matchPlayersData
    .filter((mp) => mp.team === session.winnerTeam)
    .map((mp) => mp.playerId);
  const loserPlayers = matchPlayersData
    .filter((mp) => mp.team !== session.winnerTeam)
    .map((mp) => mp.playerId);

  // Use transaction to update everything atomically
  await db.transaction(async (tx) => {
    // Update winner scores (+25)
    for (const playerId of winnerPlayers) {
      await tx
        .update(players)
        .set({ score: sql`${players.score} + 25` })
        .where(eq(players.id, playerId));
    }

    // Update loser scores (-25)
    for (const playerId of loserPlayers) {
      await tx
        .update(players)
        .set({ score: sql`${players.score} - 25` })
        .where(eq(players.id, playerId));
    }

    // Update MVP score (+10)
    await tx
      .update(players)
      .set({ score: sql`${players.score} + 10` })
      .where(eq(players.id, mvpPlayerId));

    // Update DUD score (-10)
    await tx
      .update(players)
      .set({ score: sql`${players.score} - 10` })
      .where(eq(players.id, dudPlayerId));

    // Insert awards
    await tx.insert(matchAwards).values([
      {
        matchId: session.matchId,
        playerId: mvpPlayerId,
        awardType: "mvp",
      },
      {
        matchId: session.matchId,
        playerId: dudPlayerId,
        awardType: "dud",
      },
    ]);

    // Update match
    await tx
      .update(matches)
      .set({
        completedAt: new Date(),
        winnerTeam: session.winnerTeam,
      })
      .where(eq(matches.id, session.matchId));

    // Mark session as completed
    await tx
      .update(votingSessions)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(votingSessions.id, votingSessionId));
  });

  revalidatePath(`/match/${session.matchId}`);
  revalidatePath(`/voting/${votingSessionId}`);
  revalidatePath("/players");
  revalidatePath("/ranking");

  return { matchId: session.matchId, mvpPlayerId, dudPlayerId };
}

export async function getVotingSessionAction(sessionId: string) {
  const [session] = await db
    .select()
    .from(votingSessions)
    .where(eq(votingSessions.id, sessionId))
    .limit(1);

  if (!session) {
    return null;
  }

  // Get match
  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, session.matchId))
    .limit(1);

  if (!match) {
    return null;
  }

  // Get match players with player details
  const matchPlayersData = await db
    .select({
      matchPlayerId: matchPlayers.id,
      team: matchPlayers.team,
      playerId: players.id,
      playerName: players.name,
      playerPhotoUrl: players.photoUrl,
      playerScore: players.score,
    })
    .from(matchPlayers)
    .innerJoin(players, eq(matchPlayers.playerId, players.id))
    .where(eq(matchPlayers.matchId, session.matchId));

  // Format match players
  const formattedMatchPlayers = matchPlayersData.map((mp) => ({
    team: mp.team,
    player: {
      id: mp.playerId,
      name: mp.playerName,
      photoUrl: mp.playerPhotoUrl,
      score: mp.playerScore,
    },
  }));

  // Get vote counts
  const allVotes = await db
    .select()
    .from(votes)
    .where(eq(votes.votingSessionId, sessionId));

  const mvpCounts: Record<number, number> = {};
  const dudCounts: Record<number, number> = {};

  allVotes.forEach((vote) => {
    mvpCounts[vote.mvpPlayerId] = (mvpCounts[vote.mvpPlayerId] || 0) + 1;
    dudCounts[vote.dudPlayerId] = (dudCounts[vote.dudPlayerId] || 0) + 1;
  });

  return {
    session,
    match: {
      ...match,
      matchPlayers: formattedMatchPlayers,
    },
    voteCount: allVotes.length,
    mvpCounts,
    dudCounts,
  };
}

