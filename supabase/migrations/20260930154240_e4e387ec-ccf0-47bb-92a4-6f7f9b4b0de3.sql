ALTER TABLE public.produto_overlay
  ADD COLUMN IF NOT EXISTS nivel text CHECK (nivel IN ('explorador','familiarizado','entusiasta','especialista')),
  ADD COLUMN IF NOT EXISTS linha text CHECK (linha IN ('entrada','normal','premium')),
  ADD COLUMN IF NOT EXISTS linha_manual boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS etapa text CHECK (etapa IN ('essencial','conveniencia','personalizacao','premium')),
  ADD COLUMN IF NOT EXISTS perfil_manual boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fora_do_guia boolean NOT NULL DEFAULT false;