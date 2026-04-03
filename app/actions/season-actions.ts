"use server";

import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  matchAwards,
  matchPlayers,
  matches,
  players,
  votes,
  votingSessions,
} from "@/lib/db/schema";

const CONFIRM_PHRASE = "NOVA SEASON";

/** Remove todas as partidas, votos e prêmios; zera PDLs. Mantém cadastro de jogadores (nome/foto/id). */
export async function resetSeasonAction(input: unknown) {
  let phrase: string | undefined;
  let token: string | undefined;

  if (input instanceof FormData) {
    phrase = input.get("confirm")?.toString().trim();
    token = input.get("token")?.toString();
  } else if (
    input &&
    typeof input === "object" &&
    "confirm" in input &&
    typeof (input as { confirm: unknown }).confirm === "string"
  ) {
    phrase = (input as { confirm: string }).confirm.trim();
    const t = (input as { token?: unknown }).token;
    token = typeof t === "string" ? t : undefined;
  }

  if (!phrase || phrase !== CONFIRM_PHRASE) {
    throw new Error(`Digite exatamente: ${CONFIRM_PHRASE}`);
  }

  const secret = process.env.SEASON_RESET_SECRET;
  if (secret && token !== secret) {
    throw new Error("Token de reset inválido.");
  }

  await db.transaction(async (tx) => {
    await tx.delete(votes);
    await tx.update(matches).set({ votingSessionId: null });
    await tx.delete(votingSessions);
    await tx.delete(matchAwards);
    await tx.delete(matchPlayers);
    await tx.delete(matches);
    await tx.update(players).set({ score: 0 });
  });

  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('public.matches', 'id'), 1, false)`,
  );
  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('public.match_players', 'id'), 1, false)`,
  );
  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('public.match_awards', 'id'), 1, false)`,
  );
  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('public.votes', 'id'), 1, false)`,
  );

  revalidatePath("/");
  revalidatePath("/players");
  revalidatePath("/ranking");
  revalidatePath("/historico");
  revalidatePath("/reiniciar-season");
}
