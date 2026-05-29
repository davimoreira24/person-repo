
WITH player_games AS (
  SELECT
    p.id,
    p.name,
    COUNT(*) FILTER (WHERE m.winner_team IS NOT NULL) AS games,
    COUNT(*) FILTER (WHERE m.winner_team IS NOT NULL AND mp.team = m.winner_team) AS wins
  FROM players p
  LEFT JOIN match_players mp ON mp.player_id = p.id
  LEFT JOIN matches m ON m.id = mp.match_id
  GROUP BY p.id, p.name
),
player_awards AS (
  SELECT
    p.id,
    SUM(CASE WHEN a.award_type = 'mvp' THEN 1 ELSE 0 END) AS mvps,
    SUM(CASE WHEN a.award_type = 'dud' THEN 1 ELSE 0 END) AS duds
  FROM players p
  LEFT JOIN match_awards a ON a.player_id = p.id
  GROUP BY p.id
)
SELECT
  pg.id,
  pg.name,
  pg.games,
  pg.wins,
  (pg.games - pg.wins) AS losses,
  ROUND(pg.wins::numeric / NULLIF(pg.games, 0), 3) AS win_rate,
  COALESCE(pa.mvps, 0) AS mvps,
  COALESCE(pa.duds, 0) AS duds
FROM player_games pg
LEFT JOIN player_awards pa ON pa.id = pg.id
ORDER BY pg.wins DESC, win_rate DESC NULLS LAST, pg.name ASC;


-- ====================================================================
-- 2) Quem tem mais MVPs?
-- ====================================================================
SELECT
  p.id,
  p.name,
  COUNT(*) AS mvps
FROM match_awards a
JOIN players p ON p.id = a.player_id
JOIN matches m ON m.id = a.match_id AND m.winner_team IS NOT NULL
WHERE a.award_type = 'mvp'
GROUP BY p.id, p.name
ORDER BY mvps DESC, p.name ASC;


-- ====================================================================
-- 3) Quem foi mais vezes "o pior da partida"?
-- ====================================================================
SELECT
  p.id,
  p.name,
  COUNT(*) AS duds
FROM match_awards a
JOIN players p ON p.id = a.player_id
JOIN matches m ON m.id = a.match_id AND m.winner_team IS NOT NULL
WHERE a.award_type = 'dud'
GROUP BY p.id, p.name
ORDER BY duds DESC, p.name ASC;


-- ====================================================================
-- 4) Quem ganhou mais partidas?
-- ====================================================================
SELECT
  p.id,
  p.name,
  COUNT(*) AS wins
FROM match_players mp
JOIN matches m ON m.id = mp.match_id AND m.winner_team IS NOT NULL
JOIN players p ON p.id = mp.player_id
WHERE mp.team = m.winner_team
GROUP BY p.id, p.name
ORDER BY wins DESC, p.name ASC;


-- ====================================================================
-- 5) Melhor win rate (com mínimo de 5 partidas pra evitar viés)
-- Ajuste o "MIN_GAMES" conforme o tamanho da season.
-- ====================================================================
WITH MIN_GAMES AS (SELECT 5 AS n),
stats AS (
  SELECT
    p.id,
    p.name,
    COUNT(*) FILTER (WHERE mp.team = m.winner_team) AS wins,
    COUNT(*) AS games
  FROM match_players mp
  JOIN matches m ON m.id = mp.match_id AND m.winner_team IS NOT NULL
  JOIN players p ON p.id = mp.player_id
  GROUP BY p.id, p.name
)
SELECT
  s.id,
  s.name,
  s.wins,
  s.games,
  ROUND(s.wins::numeric / NULLIF(s.games, 0), 3) AS win_rate
FROM stats s, MIN_GAMES mg
WHERE s.games >= mg.n
ORDER BY win_rate DESC, s.games DESC, s.name ASC;


-- ====================================================================
-- 6) MVP rate e Dud rate (frequência por partida jogada)
-- Útil pra ver "quem rende toda partida" vs "quem aparece pouco".
-- ====================================================================
WITH player_games AS (
  SELECT
    p.id,
    p.name,
    COUNT(*) FILTER (WHERE m.winner_team IS NOT NULL) AS games
  FROM players p
  LEFT JOIN match_players mp ON mp.player_id = p.id
  LEFT JOIN matches m ON m.id = mp.match_id
  GROUP BY p.id, p.name
),
player_awards AS (
  SELECT
    p.id,
    SUM(CASE WHEN a.award_type = 'mvp' THEN 1 ELSE 0 END) AS mvps,
    SUM(CASE WHEN a.award_type = 'dud' THEN 1 ELSE 0 END) AS duds
  FROM players p
  LEFT JOIN match_awards a ON a.player_id = p.id
  GROUP BY p.id
)
SELECT
  pg.id,
  pg.name,
  pg.games,
  COALESCE(pa.mvps, 0) AS mvps,
  COALESCE(pa.duds, 0) AS duds,
  ROUND(COALESCE(pa.mvps, 0)::numeric / NULLIF(pg.games, 0), 3) AS mvp_rate,
  ROUND(COALESCE(pa.duds, 0)::numeric / NULLIF(pg.games, 0), 3) AS dud_rate
FROM player_games pg
LEFT JOIN player_awards pa ON pa.id = pg.id
WHERE pg.games > 0
ORDER BY mvp_rate DESC NULLS LAST, mvps DESC, pg.name ASC;


-- ====================================================================
-- 7) Quem mais jogou (volume de partidas)
-- ====================================================================
SELECT
  p.id,
  p.name,
  COUNT(*) AS games
FROM match_players mp
JOIN matches m ON m.id = mp.match_id AND m.winner_team IS NOT NULL
JOIN players p ON p.id = mp.player_id
GROUP BY p.id, p.name
ORDER BY games DESC, p.name ASC;


-- ====================================================================
-- 8) Win rate por campeão (regra "Campeões aleatórios" ou modo legado)
-- Só conta partidas encerradas com champion_key registrado.
-- ====================================================================
SELECT
  mp.champion_key,
  mp.champion_name,
  COUNT(*) AS games,
  COUNT(*) FILTER (WHERE mp.team = m.winner_team) AS wins,
  ROUND(
    COUNT(*) FILTER (WHERE mp.team = m.winner_team)::numeric / NULLIF(COUNT(*), 0),
    3
  ) AS win_rate
FROM match_players mp
JOIN matches m ON m.id = mp.match_id AND m.winner_team IS NOT NULL
WHERE mp.champion_key IS NOT NULL
GROUP BY mp.champion_key, mp.champion_name
ORDER BY games DESC, win_rate DESC, mp.champion_name ASC;


-- ====================================================================
-- 9) Melhores combos jogador + campeão (mín. 3 jogos com o campeão)
-- ====================================================================
SELECT
  p.id,
  p.name AS player,
  mp.champion_name AS champion,
  COUNT(*) AS games,
  COUNT(*) FILTER (WHERE mp.team = m.winner_team) AS wins,
  ROUND(
    COUNT(*) FILTER (WHERE mp.team = m.winner_team)::numeric / NULLIF(COUNT(*), 0),
    3
  ) AS win_rate
FROM match_players mp
JOIN matches m ON m.id = mp.match_id AND m.winner_team IS NOT NULL
JOIN players p ON p.id = mp.player_id
WHERE mp.champion_key IS NOT NULL
GROUP BY p.id, p.name, mp.champion_name
HAVING COUNT(*) >= 3
ORDER BY win_rate DESC, games DESC;


-- ====================================================================
-- 10) Maior sequência de vitórias (longest win streak por jogador)
-- Usa "ilhas e lacunas" sobre as partidas encerradas em ordem.
-- ====================================================================
WITH ordered AS (
  SELECT
    p.id AS player_id,
    p.name,
    m.id AS match_id,
    m.completed_at,
    CASE WHEN mp.team = m.winner_team THEN 1 ELSE 0 END AS won
  FROM match_players mp
  JOIN matches m ON m.id = mp.match_id AND m.winner_team IS NOT NULL
  JOIN players p ON p.id = mp.player_id
),
grouped AS (
  SELECT
    player_id,
    name,
    match_id,
    won,
    -- "rótulo" da ilha: cada vez que o resultado muda, abre uma nova ilha.
    SUM(CASE WHEN won = 1 THEN 0 ELSE 1 END)
      OVER (PARTITION BY player_id ORDER BY completed_at, match_id) AS island
  FROM ordered
),
streaks AS (
  SELECT player_id, name, island, COUNT(*) AS streak_len
  FROM grouped
  WHERE won = 1
  GROUP BY player_id, name, island
)
SELECT player_id, name, MAX(streak_len) AS longest_win_streak
FROM streaks
GROUP BY player_id, name
ORDER BY longest_win_streak DESC, name ASC;


-- ====================================================================
-- ⭐ "TUDO DE UMA VEZ" — Season overview (Top N por seção)
-- O Supabase SQL Editor só mostra o resultado da ÚLTIMA query. Para ver
-- vários rankings juntos numa só tabela, rode SÓ este bloco.
-- Ajuste `top_n` para a quantidade de linhas por seção.
-- ====================================================================
WITH
params AS (SELECT 5 AS top_n, 5 AS min_games),
games AS (
  SELECT
    p.id, p.name,
    COUNT(*) FILTER (WHERE m.winner_team IS NOT NULL) AS games,
    COUNT(*) FILTER (WHERE m.winner_team IS NOT NULL AND mp.team = m.winner_team) AS wins
  FROM players p
  LEFT JOIN match_players mp ON mp.player_id = p.id
  LEFT JOIN matches m ON m.id = mp.match_id
  GROUP BY p.id, p.name
),
awards AS (
  SELECT
    p.id, p.name,
    SUM(CASE WHEN a.award_type = 'mvp' THEN 1 ELSE 0 END) AS mvps,
    SUM(CASE WHEN a.award_type = 'dud' THEN 1 ELSE 0 END) AS duds
  FROM players p
  LEFT JOIN match_awards a ON a.player_id = p.id
  GROUP BY p.id, p.name
),
sec_mvps AS (
  SELECT 1 AS section_idx, '1) Mais MVPs' AS section,
    ROW_NUMBER() OVER (ORDER BY mvps DESC, name ASC) AS rank,
    name AS player, mvps::numeric AS value, NULL::text AS detail
  FROM awards WHERE mvps > 0
),
sec_duds AS (
  SELECT 2, '2) Mais piores (duds)',
    ROW_NUMBER() OVER (ORDER BY duds DESC, name ASC),
    name, duds::numeric, NULL
  FROM awards WHERE duds > 0
),
sec_wins AS (
  SELECT 3, '3) Mais vitórias',
    ROW_NUMBER() OVER (ORDER BY wins DESC, name ASC),
    name, wins::numeric, games || ' jogos'
  FROM games WHERE wins > 0
),
sec_winrate AS (
  SELECT 4, '4) Melhor win rate (mín. partidas)',
    ROW_NUMBER() OVER (ORDER BY (wins::numeric / NULLIF(games, 0)) DESC, games DESC, name ASC),
    name,
    ROUND(wins::numeric / NULLIF(games, 0), 3),
    wins || '/' || games
  FROM games, params
  WHERE games >= params.min_games
),
sec_mvp_rate AS (
  SELECT 5, '5) MVP rate (mín. partidas)',
    ROW_NUMBER() OVER (
      ORDER BY (a.mvps::numeric / NULLIF(g.games, 0)) DESC NULLS LAST,
               a.mvps DESC, g.name ASC
    ),
    g.name,
    ROUND(a.mvps::numeric / NULLIF(g.games, 0), 3),
    a.mvps || ' MVPs em ' || g.games || ' jogos'
  FROM games g
  JOIN awards a ON a.id = g.id
  CROSS JOIN params
  WHERE g.games >= params.min_games AND a.mvps > 0
),
sec_volume AS (
  SELECT 6, '6) Mais jogos',
    ROW_NUMBER() OVER (ORDER BY games DESC, name ASC),
    name, games::numeric, wins || ' vitórias'
  FROM games WHERE games > 0
),
sec_champ_winrate AS (
  SELECT 7, '7) Win rate por campeão (≥ 3 jogos)',
    ROW_NUMBER() OVER (
      ORDER BY (COUNT(*) FILTER (WHERE mp.team = m.winner_team)::numeric / NULLIF(COUNT(*), 0)) DESC,
               COUNT(*) DESC,
               mp.champion_name ASC
    ),
    mp.champion_name,
    ROUND(
      COUNT(*) FILTER (WHERE mp.team = m.winner_team)::numeric / NULLIF(COUNT(*), 0),
      3
    ),
    COUNT(*) FILTER (WHERE mp.team = m.winner_team) || '/' || COUNT(*)
  FROM match_players mp
  JOIN matches m ON m.id = mp.match_id AND m.winner_team IS NOT NULL
  WHERE mp.champion_key IS NOT NULL
  GROUP BY mp.champion_key, mp.champion_name
  HAVING COUNT(*) >= 3
),
all_sec AS (
  SELECT * FROM sec_mvps
  UNION ALL SELECT * FROM sec_duds
  UNION ALL SELECT * FROM sec_wins
  UNION ALL SELECT * FROM sec_winrate
  UNION ALL SELECT * FROM sec_mvp_rate
  UNION ALL SELECT * FROM sec_volume
  UNION ALL SELECT * FROM sec_champ_winrate
)
SELECT section, rank, player, value, detail
FROM all_sec, params
WHERE rank <= params.top_n
ORDER BY section_idx, rank;


-- ====================================================================
-- 11) Maior sequência de derrotas (longest loss streak)
-- ====================================================================
WITH ordered AS (
  SELECT
    p.id AS player_id,
    p.name,
    m.id AS match_id,
    m.completed_at,
    CASE WHEN mp.team = m.winner_team THEN 1 ELSE 0 END AS won
  FROM match_players mp
  JOIN matches m ON m.id = mp.match_id AND m.winner_team IS NOT NULL
  JOIN players p ON p.id = mp.player_id
),
grouped AS (
  SELECT
    player_id,
    name,
    match_id,
    won,
    SUM(CASE WHEN won = 0 THEN 0 ELSE 1 END)
      OVER (PARTITION BY player_id ORDER BY completed_at, match_id) AS island
  FROM ordered
),
streaks AS (
  SELECT player_id, name, island, COUNT(*) AS streak_len
  FROM grouped
  WHERE won = 0
  GROUP BY player_id, name, island
)
SELECT player_id, name, MAX(streak_len) AS longest_loss_streak
FROM streaks
GROUP BY player_id, name
ORDER BY longest_loss_streak DESC, name ASC;
