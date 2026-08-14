import { sanitizarHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

/** Renderiza HTML editorial já sanitizado com a tipografia do site. */
export function ArtigoConteudo({
  html,
  className,
}: {
  html: string | null | undefined;
  className?: string;
}) {
  const limpo = sanitizarHtml(html);
  if (!limpo) return null;
  return (
    <div
      className={cn("conteudo-rico", className)}
      dangerouslySetInnerHTML={{ __html: limpo }}
    />
  );
}
