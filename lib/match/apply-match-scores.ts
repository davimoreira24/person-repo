import { eq, inArray, sql } from "drizzle-orm";
import type { db } from "@/lib/db";
import { players } from "@/lib/db/schema";
import { BRAVURA_WIN_BONUS } from "@/lib/match/bravura";
import { teamPdlDelta } from "@/lib/match/challenge";

export type MatchPlayerScoreRow = {
  playerId: number;
  team: number;
  bravura: boolean;
  challengeActive: boolean;
};

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function applyMatchCompletionScores(
  tx: DbTx,
  input: {
    winnerTeam: 1 | 2;
    mvpPlayerId: number;
    dudPlayerId: number;
    rows: MatchPlayerScoreRow[];
  },
): Promise<void> {
  const { winnerTeam, mvpPlayerId, dudPlayerId, rows } = input;
  for (const row of rows) {
    const isWinner = row.team === winnerTeam;
    const delta = teamPdlDelta(isWinner, row.challengeActive);
    if (delta === 0) continue;

    await tx
      .update(players)
      .set({ score: sql`${players.score} + ${delta}` })
      .where(eq(players.id, row.playerId));
  }

  await tx
    .update(players)
    .set({ score: sql`${players.score} + 10` })
    .where(eq(players.id, mvpPlayerId));

  await tx
    .update(players)
    .set({ score: sql`${players.score} - 10` })
    .where(eq(players.id, dudPlayerId));

  const bravuraWinners = rows
    .filter((row) => row.team === winnerTeam && row.bravura === true)
    .map((row) => row.playerId);

  if (bravuraWinners.length > 0) {
    await tx
      .update(players)
      .set({ score: sql`${players.score} + ${BRAVURA_WIN_BONUS}` })
      .where(inArray(players.id, bravuraWinners));
  }
}
