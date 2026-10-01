GRANT INSERT ON public.guia_evento TO anon, authenticated;
CREATE POLICY "Qualquer um registra evento do guia" ON public.guia_evento FOR INSERT TO anon, authenticated
WITH CHECK (evento IN ('quiz_iniciado','quiz_concluido','clique_produto_kit') AND coalesce(length(produto_slug),0) <= 200 AND coalesce(length(anon_id),0) <= 80 AND coalesce(length(nivel),0) <= 40 AND coalesce(length(linha),0) <= 40);
ALTER FUNCTION public.registrar_evento_guia(text,text,text,text,text) SECURITY INVOKER;