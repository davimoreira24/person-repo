-- Modo Draft + regra "Campeões aleatórios".
-- Aplicar uma vez no SQL Editor do Supabase (idempotente).

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS champions_random boolean NOT NULL DEFAULT false;

-- Registros legados em modo aleatório passam a refletir a nova regra.
UPDATE matches
SET champions_random = true
WHERE game_mode = 'random_champions';

COMMENT ON COLUMN matches.game_mode IS 'classic | draft | random_champions (legado)';
COMMENT ON COLUMN matches.champions_random IS 'Regra: sorteia 1 campeão por rota (Meraki).';
