-- Bravura (opt-in por jogador) + gate da tela pré-partida.
-- Rode no SQL Editor do Supabase (idempotente).

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS loadout_completed_at timestamptz;

ALTER TABLE match_players
  ADD COLUMN IF NOT EXISTS bravura boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN match_players.bravura IS 'Carta de Bravura: campeão aleatório na rota; +10 PDL se o time vencer.';
COMMENT ON COLUMN matches.loadout_completed_at IS 'Quando o admin confirmou a pré-partida (loadout).';

-- Partidas antigas já em andamento / encerradas: considerar loadout feito.
UPDATE matches
SET loadout_completed_at = COALESCE(completed_at, created_at)
WHERE loadout_completed_at IS NULL;
