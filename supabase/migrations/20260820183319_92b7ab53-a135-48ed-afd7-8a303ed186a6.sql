ALTER TABLE public.produto_overlay DROP CONSTRAINT IF EXISTS produto_overlay_status_revisao_check;
UPDATE public.produto_overlay SET status_revisao = 'reprovado' WHERE status_revisao = 'rejeitado';
ALTER TABLE public.produto_overlay ADD CONSTRAINT produto_overlay_status_revisao_check CHECK (status_revisao IS NULL OR status_revisao = ANY (ARRAY['pendente','aprovado','reprovado']));