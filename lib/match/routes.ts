export function matchPrePartidaPath(matchId: number): string {
  return `/match/${matchId}/pre-partida`;
}

export function playerProfilePath(playerId: number): string {
  return `/jogador/${playerId}`;
}
