ALTER TABLE public.post ADD COLUMN IF NOT EXISTS seo_keywords text;
ALTER TABLE public.produto_overlay ADD COLUMN IF NOT EXISTS seo_keywords text;
ALTER TABLE public.seo_rota ADD COLUMN IF NOT EXISTS seo_keywords text;