-- Modo aleatório: campeões por rota + analytics (rode no SQL Editor do Supabase se ainda não aplicou via Drizzle).

ALTER TABLE matches
ADD COLUMN IF NOT EXISTS game_mode varchar(32) NOT NULL DEFAULT 'classic';

ALTER TABLE match_players
ADD COLUMN IF NOT EXISTS champion_key varchar(48);

ALTER TABLE match_players
ADD COLUMN IF NOT EXISTS champion_name varchar(80);

COMMENT ON COLUMN matches.game_mode IS 'classic | random_champions';
COMMENT ON COLUMN match_players.champion_key IS 'Key do campeão (Meraki/Data Dragon), ex. Ahri';
