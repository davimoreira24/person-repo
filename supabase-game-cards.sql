-- Cartas de modificador de regra (cadastre/edite no Supabase; o app sorteia uma por partida quando “cartas ativas” está ligado na lobby).

CREATE TABLE IF NOT EXISTS game_cards (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  image_url TEXT
);

CREATE INDEX IF NOT EXISTS game_cards_active_idx ON game_cards (active);

-- Bases já criadas: adiciona coluna de imagem opcional
ALTER TABLE game_cards
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS selected_game_card_id INTEGER REFERENCES game_cards (id) ON DELETE SET NULL;

-- Seeds (ajuste ou desative com active = false)
INSERT INTO game_cards (slug, title, description, sort_order, active) VALUES
  ('all-tp', 'All TP', 'Todos os 10 jogadores devem obrigatoriamente usar o feitiço Teleporte.', 10, true),
  ('shotcall-unico', 'Shotcall único', 'Apenas um jogador do time tem permissão para dar calls e orientar a equipe.', 20, true),
  ('calls-separadas', 'Calls separadas', 'Os times devem jogar em canais de voz separados (sem call geral).', 30, true),
  ('proteja-o-rei', 'Proteja o rei', 'Um jogador é designado como o "Rei". Se ele morrer 5 vezes, o time deve se render (FF) imediatamente.', 40, true),
  ('ultimate-vetada', 'Ultimate vetada', 'Ninguém pode usar ultimate.', 50, true),
  ('cassiopeia', 'Cassiopeia', 'Ninguém pode comprar botas.', 60, true),
  ('baron-killers', 'Baron killers', 'O time que garantir o primeiro barão ganha a partida, independentemente do estado do nexus.', 70, true),
  ('no-comunicacao', 'No comunicação', 'Os times não podem falar no Discord; apenas chat do jogo e pings.', 80, true),
  ('draft-invertido', 'Draft invertido', 'Os times escolhem o draft do time adversário.', 90, true)
ON CONFLICT (slug) DO NOTHING;
