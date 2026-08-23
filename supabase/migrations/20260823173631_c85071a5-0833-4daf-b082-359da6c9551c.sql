ALTER TABLE public.post
  ADD COLUMN IF NOT EXISTS og_titulo text,
  ADD COLUMN IF NOT EXISTS og_descricao text,
  ADD COLUMN IF NOT EXISTS og_imagem_url text,
  ADD COLUMN IF NOT EXISTS og_imagem_alt text,
  ADD COLUMN IF NOT EXISTS twitter_card text NOT NULL DEFAULT 'summary_large_image';