-- Campos Riot ID + cache de elo/mastery nos jogadores.
-- Rode no SQL Editor do Supabase (idempotente).

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS riot_game_name varchar(80);

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS riot_tag_line varchar(16);

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS riot_puuid varchar(128);

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS riot_platform varchar(16) DEFAULT 'br1';

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS riot_region varchar(16) DEFAULT 'americas';

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS riot_solo_tier varchar(24);

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS riot_solo_rank varchar(8);

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS riot_solo_lp integer;

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS riot_solo_wins integer;

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS riot_solo_losses integer;

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS riot_top_champions jsonb;

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS riot_stats_synced_at timestamptz;

CREATE INDEX IF NOT EXISTS players_riot_puuid_idx ON players (riot_puuid);

COMMENT ON COLUMN players.riot_game_name IS 'Riot ID gameName (antes do #).';
COMMENT ON COLUMN players.riot_tag_line IS 'Riot ID tagLine (depois do #).';
COMMENT ON COLUMN players.riot_puuid IS 'PUUID da conta Riot (Account-v1).';
