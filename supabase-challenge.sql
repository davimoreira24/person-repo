-- Desafio PDL: opt-in anônimo por jogador (link único por participante).
-- Rode no SQL Editor do Supabase (idempotente).

ALTER TABLE match_players
  ADD COLUMN IF NOT EXISTS challenge_active boolean NOT NULL DEFAULT false;

ALTER TABLE match_players
  ADD COLUMN IF NOT EXISTS challenge_token uuid;

UPDATE match_players
SET challenge_token = gen_random_uuid()
WHERE challenge_token IS NULL;

ALTER TABLE match_players
  ALTER COLUMN challenge_token SET NOT NULL;

ALTER TABLE match_players
  ALTER COLUMN challenge_token SET DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS match_players_challenge_token_idx
  ON match_players (challenge_token);

COMMENT ON COLUMN match_players.challenge_active IS 'Desafio PDL: dobra ganho (+25→+50) e perda (−25→−50) do time.';
COMMENT ON COLUMN match_players.challenge_token IS 'Token único para o jogador ativar/desativar o desafio via link privado.';
