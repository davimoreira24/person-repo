import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchPlayers, matches, players } from "@/lib/db/schema";
import {
  MATCH_GAME_CLASSIC,
  MATCH_GAME_DRAFT,
  MATCH_GAME_RANDOM_CHAMPIONS,
} from "@/lib/match-game-mode";
import { postDiscordWebhook } from "@/lib/discord/webhook";

const LANE_LABELS = ["Topo", "Selva", "Meio", "Atirador", "Suporte"] as const;

function gameModeLabel(gameMode: string): string {
  if (gameMode === MATCH_GAME_DRAFT) return "Draft";
  if (gameMode === MATCH_GAME_RANDOM_CHAMPIONS) return "Clássico (legado aleatório)";
  if (gameMode === MATCH_GAME_CLASSIC) return "Clássico";
  return gameMode;
}

export function formatMatchTeamsDiscordMessage(input: {
  matchId: number;
  gameMode: string;
  championsRandom: boolean;
  teamOne: Array<{ laneLabel: string; name: string }>;
  teamTwo: Array<{ laneLabel: string; name: string }>;
}): string {
  const mode = gameModeLabel(input.gameMode);
  const randomNote = input.championsRandom ? " · Campeões aleatórios" : "";

  const formatTeam = (
    title: string,
    rows: Array<{ laneLabel: string; name: string }>,
  ) =>
    [title, ...rows.map((r) => `${r.laneLabel} — ${r.name}`)].join("\n");

  return [
    `⚔️ Partida #${input.matchId} — ${mode}${randomNote}`,
    "",
    formatTeam("Time 1 (Azul)", input.teamOne),
    "",
    formatTeam("Time 2 (Vermelho)", input.teamTwo),
  ].join("\n");
}

/**
 * Lê a partida no banco e posta times + lanes no Discord.
 * Nunca lança — a criação da partida não deve falhar por causa do Discord.
 */
export async function notifyMatchTeamsToDiscord(
  matchId: number,
): Promise<void> {
  try {
    const [match] = await db
      .select({
        id: matches.id,
        gameMode: matches.gameMode,
        championsRandom: matches.championsRandom,
      })
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!match) {
      console.warn(`[discord] partida #${matchId} não encontrada.`);
      return;
    }

    const rows = await db
      .select({
        playerId: matchPlayers.playerId,
        team: matchPlayers.team,
        name: players.name,
        matchPlayerId: matchPlayers.id,
      })
      .from(matchPlayers)
      .innerJoin(players, eq(matchPlayers.playerId, players.id))
      .where(eq(matchPlayers.matchId, matchId))
      .orderBy(asc(matchPlayers.id));

    if (rows.length !== 10) {
      console.warn(
        `[discord] partida #${matchId} tem ${rows.length} jogadores (esperado 10).`,
      );
      return;
    }

    const teamOneRows = rows.filter((r) => r.team === 1);
    const teamTwoRows = rows.filter((r) => r.team === 2);

    const toLaneRows = (teamRows: typeof rows) =>
      teamRows.map((r, index) => ({
        laneLabel: LANE_LABELS[index] ?? `Rota ${index + 1}`,
        name: r.name,
      }));

    const content = formatMatchTeamsDiscordMessage({
      matchId: match.id,
      gameMode: match.gameMode,
      championsRandom: match.championsRandom === true,
      teamOne: toLaneRows(teamOneRows),
      teamTwo: toLaneRows(teamTwoRows),
    });

    await postDiscordWebhook(content);
  } catch (error) {
    console.error(`[discord] notifyMatchTeamsToDiscord(#${matchId}):`, error);
  }
}
