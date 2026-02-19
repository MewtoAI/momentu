-- Migration: Momentu AI Schema
-- Data: 2026-02-19

-- 1. Adicionar campos na tabela users
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS used_free_sample BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS free_sample_used_at TIMESTAMPTZ;

-- 2. Tabela album_sessions
CREATE TABLE IF NOT EXISTS album_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL CHECK (product_type IN ('print', 'digital')),
  status TEXT DEFAULT 'questionnaire' CHECK (status IN (
    'questionnaire', 'sample_requested', 'sample_ready', 
    'paid', 'uploading', 'grouping', 'adjusting', 
    'generating', 'done', 'abandoned'
  )),
  questionnaire JSONB DEFAULT '{}',
  reference_album_id UUID,
  photo_count INT DEFAULT 0,
  page_count INT,
  format TEXT,
  price NUMERIC(10,2),
  groupings JSONB DEFAULT '[]',
  adjustment_annotations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela generation_jobs
CREATE TABLE IF NOT EXISTS generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES album_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sample', 'full')),
  status TEXT DEFAULT 'queued' CHECK (status IN (
    'queued', 'processing', 'done', 'failed'
  )),
  pages_total INT DEFAULT 0,
  pages_done INT DEFAULT 0,
  result_url TEXT,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela gallery_albums (exemplos para a galeria de inspiração)
CREATE TABLE IF NOT EXISTS gallery_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  style TEXT NOT NULL CHECK (style IN (
    'romantic', 'classic', 'vibrant', 'minimal', 'vintage', 'bohemian'
  )),
  occasion TEXT NOT NULL CHECK (occasion IN (
    'wedding', 'birthday', 'baby', 'travel', 'family', 'graduation', 'other'
  )),
  product_type TEXT DEFAULT 'print' CHECK (product_type IN ('print', 'digital')),
  thumbnail_url TEXT,
  preview_pages JSONB DEFAULT '[]',
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_album_sessions_user_id ON album_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_album_sessions_status ON album_sessions(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_session_id ON generation_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_gallery_albums_style ON gallery_albums(style);
CREATE INDEX IF NOT EXISTS idx_gallery_albums_occasion ON gallery_albums(occasion);

-- 6. Trigger updated_at para album_sessions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_album_sessions_updated_at
  BEFORE UPDATE ON album_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. RLS (Row Level Security)
ALTER TABLE album_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_albums ENABLE ROW LEVEL SECURITY;

-- Usuário só vê suas próprias sessões
CREATE POLICY "users_own_sessions" ON album_sessions
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Usuário só vê jobs das suas sessões
CREATE POLICY "users_own_jobs" ON generation_jobs
  FOR ALL USING (
    session_id IN (SELECT id FROM album_sessions WHERE user_id::text = auth.uid()::text)
  );

-- Gallery é pública (leitura)
CREATE POLICY "gallery_public_read" ON gallery_albums
  FOR SELECT USING (true);

-- 8. Seed: 3 álbuns de exemplo na galeria
INSERT INTO gallery_albums (title, style, occasion, product_type, thumbnail_url, preview_pages, is_featured) VALUES
(
  'Casamento na Praia',
  'romantic',
  'wedding',
  'print',
  '/gallery/casamento-praia/thumb.jpg',
  '["/gallery/casamento-praia/p1.jpg", "/gallery/casamento-praia/p2.jpg", "/gallery/casamento-praia/p3.jpg"]',
  true
),
(
  'Primeiro Ano do Bernardo',
  'minimal',
  'baby',
  'print', 
  '/gallery/bernardo-1ano/thumb.jpg',
  '["/gallery/bernardo-1ano/p1.jpg", "/gallery/bernardo-1ano/p2.jpg"]',
  true
),
(
  'Viagem por Portugal',
  'vintage',
  'travel',
  'digital',
  '/gallery/portugal/thumb.jpg',
  '["/gallery/portugal/p1.jpg", "/gallery/portugal/p2.jpg", "/gallery/portugal/p3.jpg"]',
  true
);
