-- Stats importadas do replay (.rofl) ao encerrar a partida.
-- Rode no SQL Editor do Supabase.

alter table matches
  add column if not exists rofl_imported_at timestamptz,
  add column if not exists game_length_ms integer;

alter table match_players
  add column if not exists kills integer,
  add column if not exists deaths integer,
  add column if not exists assists integer;
