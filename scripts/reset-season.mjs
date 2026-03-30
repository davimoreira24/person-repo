/**
 * Reinicia a season via SUPABASE_DB_URL (mesma variável do app).
 * Uso: node scripts/reset-season.mjs
 */
import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: ".env.local" });
dotenv.config();

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("Defina SUPABASE_DB_URL no .env ou .env.local");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require" });

try {
  await sql.begin(async (tx) => {
    await tx`DELETE FROM votes`;
    await tx`UPDATE matches SET voting_session_id = NULL WHERE voting_session_id IS NOT NULL`;
    await tx`DELETE FROM voting_sessions`;
    await tx`DELETE FROM match_awards`;
    await tx`DELETE FROM match_players`;
    await tx`DELETE FROM matches`;
    await tx`UPDATE players SET score = 0`;
  });

  await sql`SELECT setval(pg_get_serial_sequence('public.matches', 'id'), 1, false)`;
  await sql`SELECT setval(pg_get_serial_sequence('public.match_players', 'id'), 1, false)`;
  await sql`SELECT setval(pg_get_serial_sequence('public.match_awards', 'id'), 1, false)`;
  await sql`SELECT setval(pg_get_serial_sequence('public.votes', 'id'), 1, false)`;

  console.log("Season reiniciada: partidas e PDLs zerados; jogadores mantidos.");
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
