-- Reinício de season: executar uma vez no SQL Editor do Supabase (ou psql).
-- Mantém a tabela players (nome, foto, id); zera score e apaga todo histórico de partidas.

BEGIN;

DELETE FROM votes;
UPDATE matches SET voting_session_id = NULL WHERE voting_session_id IS NOT NULL;
DELETE FROM voting_sessions;
DELETE FROM match_awards;
DELETE FROM match_players;
DELETE FROM matches;

UPDATE players SET score = 0;

SELECT setval(pg_get_serial_sequence('public.matches', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.match_players', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.match_awards', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.votes', 'id'), 1, false);

COMMIT;
