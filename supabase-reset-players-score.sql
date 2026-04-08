-- Zerar PDLS (coluna `score`) dos jogadores listados.
-- Rode primeiro o SELECT; se os nomes baterem com o teu banco, executa o UPDATE.
--
-- Case-sensitive: `IN` / `=` comparam o texto exactamente (maiúsculas/minúsculas
-- e caracteres). Não usar ILIKE nem LOWER() — o nome no script tem de ser igual
-- ao valor guardado em `players.name`.

-- Pré-visualização
SELECT id, name, score
FROM players
WHERE name IN (
  'EDER',
  'JOAGRI KIN KIN',
  'GUIGAS',
  'MRPEGADO',
  'CRISTAN',
  'JOAO',
  'CACETAO IRADO',
  'ÍTALA QUEEN',
  'TIGRESA VIP',
  'CELIO'
)
ORDER BY name;

-- Se o SELECT acima devolver exactamente os 10 jogadores certos, executar:
UPDATE players
SET score = 0
WHERE name IN (
  'EDER',
  'JOAGRI KIN KIN',
  'GUIGAS',
  'MRPEGADO',
  'CRISTAN',
  'JOAO',
  'CACETAO IRADO',
  'ÍTALA QUEEN',
  'TIGRESA VIP',
  'CELIO'
);
