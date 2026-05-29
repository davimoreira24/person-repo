/** PDL base de vitória/derrota do time (antes do desafio). */
export const TEAM_WIN_PDL = 25;
export const TEAM_LOSS_PDL = 25;

/** Multiplicador quando o jogador ativa o Desafio PDL. */
export const CHALLENGE_PDL_MULTIPLIER = 2;

export function matchChallengePath(matchId: number, token: string): string {
  return `/match/${matchId}/d/${token}`;
}

export function teamPdlDelta(isWinner: boolean, challengeActive: boolean): number {
  const base = isWinner ? TEAM_WIN_PDL : -TEAM_LOSS_PDL;
  return challengeActive ? base * CHALLENGE_PDL_MULTIPLIER : base;
}

export type ChallengeDiscordLink = {
  name: string;
  url: string;
};

export function buildChallengeDiscordMessage(input: {
  matchId: number;
  origin: string;
  links: ChallengeDiscordLink[];
  prePartidaUrl: string;
}): string {
  const { matchId, origin, links, prePartidaUrl } = input;
  const base = origin.replace(/\/$/, "");

  const lines = links.map(
    (link) => `• ${link.name} — ${base}${link.url}`,
  );

  return [
    `⚔️ DESAFIO PDL — Partida #${matchId}`,
    "",
    "Quem ativar DOBRA ganho e perda de PDL nesta partida (+50 / −50 no time).",
    "Revelação só no fim — ninguém vê quem ativou até encerrar.",
    "",
    "Clique APENAS no seu link (dá para mudar até o admin confirmar):",
    "",
    ...lines,
    "",
    `⏳ Pré-partida (contador anônimo): ${base}${prePartidaUrl}`,
  ].join("\n");
}
